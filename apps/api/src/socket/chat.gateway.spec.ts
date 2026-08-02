/**
 * Тесты для `ChatGateway` — TEST-WS-GATEWAYS-001.
 *
 * Покрытие:
 *   • handleConnection: no/invalid token → disconnect; valid → auto-join user:{sub}
 *   • handleJoinChatRoom (API-WS-AUDIT-001): участник треда (buyer/seller) → join,
 *     не участник / thread not found / ошибка DB → отказ (fail-closed)
 *   • chat:typing: anti-spoof через членство в room; ретрансляция с ролью
 */
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import type { Socket } from 'socket.io';

interface SocketCalls {
  joined: string[];
  left: string[];
  disconnected: boolean;
}

function makeSocket(opts: {
  user?: { sub: string; role?: string };
  token?: string;
  rooms?: string[];
} = {}): { sock: Socket; calls: SocketCalls; toEmit: jest.Mock; to: jest.Mock } {
  const calls: SocketCalls = { joined: [], left: [], disconnected: false };
  const toEmit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit: toEmit });
  const sock = {
    id: 'sock-1',
    data: { user: opts.user },
    handshake: { auth: { token: opts.token } },
    rooms: new Set(opts.rooms ?? []),
    join: (room: string) => { calls.joined.push(room); },
    leave: (room: string) => { calls.left.push(room); },
    disconnect: () => { calls.disconnected = true; },
    to,
  } as unknown as Socket;
  return { sock, calls, toEmit, to };
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let prisma: {
    chatThread: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let jwt: { verify: jest.Mock };

  beforeEach(() => {
    prisma = {
      chatThread: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    jwt = { verify: jest.fn() };
    const config = { get: jest.fn().mockReturnValue('test-secret') };
    gateway = new ChatGateway(
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  describe('handleConnection', () => {
    it('нет токена → disconnect, никакого auto-join', () => {
      const { sock, calls } = makeSocket({ token: undefined });
      gateway.handleConnection(sock);
      expect(calls.disconnected).toBe(true);
      expect(calls.joined).toEqual([]);
    });

    it('невалидный токен (verify бросает) → disconnect', () => {
      jwt.verify.mockImplementation(() => { throw new Error('bad token'); });
      const { sock, calls } = makeSocket({ token: 'garbage' });
      gateway.handleConnection(sock);
      expect(calls.disconnected).toBe(true);
      expect(calls.joined).toEqual([]);
    });

    it('валидный токен → user в data + auto-join user:{sub} (push-notifications room)', () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', role: 'BUYER' });
      const { sock, calls } = makeSocket({ token: 'ok' });
      gateway.handleConnection(sock);
      expect(calls.disconnected).toBe(false);
      expect((sock.data as { user: { sub: string } }).user.sub).toBe('user-1');
      expect(calls.joined).toEqual(['user:user-1']);
    });
  });

  describe('handleJoinChatRoom (API-WS-AUDIT-001 participant check)', () => {
    const thread = { buyerId: 'b-1', sellerId: 's-1' };

    it('анонимный сокет (нет user) → disconnect', async () => {
      const { sock, calls } = makeSocket({});
      await gateway.handleJoinChatRoom({ threadId: 't-1' }, sock);
      expect(calls.disconnected).toBe(true);
    });

    it('невалидный threadId → отказ без DB-lookup', async () => {
      const { sock, calls } = makeSocket({ user: { sub: 'user-1' } });
      await gateway.handleJoinChatRoom({ threadId: '' }, sock);
      await gateway.handleJoinChatRoom({ threadId: 5 as unknown as string }, sock);
      expect(calls.joined).toEqual([]);
      expect(prisma.chatThread.findUnique).not.toHaveBeenCalled();
    });

    it('thread не найден → отказ', async () => {
      prisma.chatThread.findUnique.mockResolvedValue(null);
      const { sock, calls } = makeSocket({ user: { sub: 'user-1' } });
      await gateway.handleJoinChatRoom({ threadId: 't-404' }, sock);
      expect(calls.joined).toEqual([]);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('юзер-buyer участник треда → join thread:{id}', async () => {
      prisma.chatThread.findUnique.mockResolvedValue(thread);
      prisma.user.findUnique.mockResolvedValue({ buyer: { id: 'b-1' }, seller: null });
      const { sock, calls } = makeSocket({ user: { sub: 'user-1' } });
      await gateway.handleJoinChatRoom({ threadId: 't-1' }, sock);
      expect(calls.joined).toEqual(['thread:t-1']);
    });

    it('юзер-seller участник треда → join thread:{id}', async () => {
      prisma.chatThread.findUnique.mockResolvedValue(thread);
      prisma.user.findUnique.mockResolvedValue({ buyer: null, seller: { id: 's-1' } });
      const { sock, calls } = makeSocket({ user: { sub: 'user-2' } });
      await gateway.handleJoinChatRoom({ threadId: 't-1' }, sock);
      expect(calls.joined).toEqual(['thread:t-1']);
    });

    it('не участник (чужой buyer и seller) → отказ (information leak fix)', async () => {
      prisma.chatThread.findUnique.mockResolvedValue(thread);
      prisma.user.findUnique.mockResolvedValue({ buyer: { id: 'b-FOREIGN' }, seller: { id: 's-FOREIGN' } });
      const { sock, calls } = makeSocket({ user: { sub: 'user-3' } });
      await gateway.handleJoinChatRoom({ threadId: 't-1' }, sock);
      expect(calls.joined).toEqual([]);
      expect(calls.disconnected).toBe(false);
    });

    it('юзер без buyer/seller профилей → отказ', async () => {
      prisma.chatThread.findUnique.mockResolvedValue(thread);
      prisma.user.findUnique.mockResolvedValue({ buyer: null, seller: null });
      const { sock, calls } = makeSocket({ user: { sub: 'user-4' } });
      await gateway.handleJoinChatRoom({ threadId: 't-1' }, sock);
      expect(calls.joined).toEqual([]);
    });

    it('ошибка DB → fail-closed отказ (без unhandled rejection)', async () => {
      prisma.chatThread.findUnique.mockRejectedValue(new Error('db down'));
      const { sock, calls } = makeSocket({ user: { sub: 'user-1' } });
      await expect(
        gateway.handleJoinChatRoom({ threadId: 't-1' }, sock),
      ).resolves.toBeUndefined();
      expect(calls.joined).toEqual([]);
    });
  });

  describe('chat:typing (anti-spoof)', () => {
    it('не участник room → событие игнорируется', () => {
      const { sock, to } = makeSocket({ user: { sub: 'user-1', role: 'BUYER' } });
      gateway.handleTyping({ threadId: 't-1', isTyping: true }, sock);
      expect(to).not.toHaveBeenCalled();
    });

    it('участник room → ретрансляция chat:typing остальным с ролью', () => {
      const { sock, to, toEmit } = makeSocket({
        user: { sub: 'user-1', role: 'SELLER' },
        rooms: ['thread:t-1'],
      });
      gateway.handleTyping({ threadId: 't-1', isTyping: true }, sock);
      expect(to).toHaveBeenCalledWith('thread:t-1');
      expect(toEmit).toHaveBeenCalledWith('chat:typing', {
        threadId: 't-1',
        role: 'SELLER',
        isTyping: true,
      });
    });

    it('роль не SELLER → ретранслируется как BUYER; isTyping приводится к boolean', () => {
      const { sock, toEmit } = makeSocket({
        user: { sub: 'user-1', role: 'ADMIN' },
        rooms: ['thread:t-1'],
      });
      gateway.handleTyping({ threadId: 't-1', isTyping: 0 as unknown as boolean }, sock);
      expect(toEmit).toHaveBeenCalledWith('chat:typing', {
        threadId: 't-1',
        role: 'BUYER',
        isTyping: false,
      });
    });

    it('анонимный сокет или невалидный threadId → игнор', () => {
      const anon = makeSocket({ rooms: ['thread:t-1'] });
      gateway.handleTyping({ threadId: 't-1', isTyping: true }, anon.sock);
      expect(anon.to).not.toHaveBeenCalled();

      const badThread = makeSocket({ user: { sub: 'u-1' }, rooms: ['thread:t-1'] });
      gateway.handleTyping({ threadId: 9 as unknown as string, isTyping: true }, badThread.sock);
      expect(badThread.to).not.toHaveBeenCalled();
    });
  });
});
