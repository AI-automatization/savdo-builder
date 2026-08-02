/**
 * Тесты для `OrdersGateway` — фокус на API-WS-AUDIT-002 (User.id vs Buyer.id)
 * и API-WS-AUDIT-001 (store-ownership на join-seller-room).
 *
 * Покрытие:
 *   • handleJoinBuyerRoom: принимает `userId` И legacy `buyerId`
 *   • валидация: requestedId должен === user.sub (User.id из JWT)
 *   • foreign id → silently return, не disconnect
 *   • no user → disconnect
 *   • handleJoinSellerRoom: JWT match / DB-verified / чужой store → отказ / fail-closed
 *   • emitOrderStatusChangedToBuyer резолвит Buyer.id → User.id
 *   • buyer без userId → warn + skip
 */
import { OrdersGateway } from './orders.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import type { Socket, Server } from 'socket.io';

function makeSocket(user?: { sub: string; role?: string; storeId?: string }): Socket {
  const calls = { joined: [] as string[], disconnected: false };
  return {
    id: 'sock-1',
    data: { user },
    join: (room: string) => { calls.joined.push(room); },
    disconnect: () => { calls.disconnected = true; },
    // expose calls for assertions
    _calls: calls,
  } as unknown as Socket;
}

describe('OrdersGateway', () => {
  let gateway: OrdersGateway;
  let prisma: { buyer: { findUnique: jest.Mock }; seller: { findUnique: jest.Mock } };
  let emit: jest.Mock;
  let server: Server;

  beforeEach(() => {
    prisma = { buyer: { findUnique: jest.fn() }, seller: { findUnique: jest.fn() } };
    emit = jest.fn();
    server = { to: jest.fn().mockReturnValue({ emit }) } as unknown as Server;
    gateway = new OrdersGateway(
      {} as JwtService,
      {} as ConfigService,
      prisma as unknown as PrismaService,
    );
    (gateway as unknown as { server: Server }).server = server;
  });

  describe('handleJoinBuyerRoom (API-WS-AUDIT-002)', () => {
    it('preferred userId — пускает в room buyer:{User.id}', () => {
      const sock = makeSocket({ sub: 'user-1' });
      gateway.handleJoinBuyerRoom({ userId: 'user-1' }, sock);
      const calls = (sock as unknown as { _calls: { joined: string[] } })._calls;
      expect(calls.joined).toEqual(['buyer:user-1']);
    });

    it('legacy buyerId — тоже пускает (backward compat)', () => {
      const sock = makeSocket({ sub: 'user-1' });
      gateway.handleJoinBuyerRoom({ buyerId: 'user-1' }, sock);
      const calls = (sock as unknown as { _calls: { joined: string[] } })._calls;
      expect(calls.joined).toEqual(['buyer:user-1']);
    });

    it('foreign id — silently rejected, не disconnect', () => {
      const sock = makeSocket({ sub: 'user-1' });
      gateway.handleJoinBuyerRoom({ userId: 'user-OTHER' }, sock);
      const calls = (sock as unknown as { _calls: { joined: string[]; disconnected: boolean } })._calls;
      expect(calls.joined).toEqual([]);
      expect(calls.disconnected).toBe(false);
    });

    it('userId приоритетнее legacy buyerId если оба переданы', () => {
      const sock = makeSocket({ sub: 'user-1' });
      // Если оба переданы и совпадают с user.sub — userId wins
      gateway.handleJoinBuyerRoom({ userId: 'user-1', buyerId: 'user-OTHER' }, sock);
      const calls = (sock as unknown as { _calls: { joined: string[] } })._calls;
      expect(calls.joined).toEqual(['buyer:user-1']);
    });

    it('no user (анонимный socket) → disconnect', () => {
      const sock = makeSocket(undefined);
      gateway.handleJoinBuyerRoom({ userId: 'whatever' }, sock);
      const calls = (sock as unknown as { _calls: { joined: string[]; disconnected: boolean } })._calls;
      expect(calls.disconnected).toBe(true);
    });

    it('пустой data → silently rejected', () => {
      const sock = makeSocket({ sub: 'user-1' });
      gateway.handleJoinBuyerRoom({}, sock);
      const calls = (sock as unknown as { _calls: { joined: string[] } })._calls;
      expect(calls.joined).toEqual([]);
    });

    it('не-строковый id → silently rejected', () => {
      const sock = makeSocket({ sub: 'user-1' });
      gateway.handleJoinBuyerRoom({ userId: 123 as unknown as string }, sock);
      const calls = (sock as unknown as { _calls: { joined: string[] } })._calls;
      expect(calls.joined).toEqual([]);
    });
  });

  describe('handleJoinSellerRoom (API-WS-AUDIT-001 store-ownership)', () => {
    function calls(sock: Socket) {
      return (sock as unknown as { _calls: { joined: string[]; disconnected: boolean } })._calls;
    }

    it('не-SELLER (BUYER) → disconnect', async () => {
      const sock = makeSocket({ sub: 'user-1', role: 'BUYER' });
      await gateway.handleJoinSellerRoom({ storeId: 'store-1' }, sock);
      expect(calls(sock).disconnected).toBe(true);
      expect(calls(sock).joined).toEqual([]);
    });

    it('невалидный storeId (пустой/не строка) → отказ без DB-lookup', async () => {
      const sock = makeSocket({ sub: 'user-1', role: 'SELLER' });
      await gateway.handleJoinSellerRoom({ storeId: undefined as unknown as string }, sock);
      await gateway.handleJoinSellerRoom({ storeId: 42 as unknown as string }, sock);
      expect(calls(sock).joined).toEqual([]);
      expect(prisma.seller.findUnique).not.toHaveBeenCalled();
    });

    it('JWT.storeId совпал → join без DB-lookup', async () => {
      const sock = makeSocket({ sub: 'user-1', role: 'SELLER', storeId: 'store-1' });
      await gateway.handleJoinSellerRoom({ storeId: 'store-1' }, sock);
      expect(calls(sock).joined).toEqual(['seller:store-1']);
      expect(prisma.seller.findUnique).not.toHaveBeenCalled();
    });

    it('JWT без storeId + DB подтвердил владение → join', async () => {
      prisma.seller.findUnique.mockResolvedValue({ store: { id: 'store-1' } });
      const sock = makeSocket({ sub: 'user-1', role: 'SELLER' });
      await gateway.handleJoinSellerRoom({ storeId: 'store-1' }, sock);
      expect(prisma.seller.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { store: { select: { id: true } } },
      });
      expect(calls(sock).joined).toEqual(['seller:store-1']);
    });

    it('чужой storeId (DB владеет другим) → отказ, не disconnect', async () => {
      prisma.seller.findUnique.mockResolvedValue({ store: { id: 'store-MINE' } });
      const sock = makeSocket({ sub: 'user-1', role: 'SELLER', storeId: 'store-MINE' });
      await gateway.handleJoinSellerRoom({ storeId: 'store-FOREIGN' }, sock);
      expect(calls(sock).joined).toEqual([]);
      expect(calls(sock).disconnected).toBe(false);
    });

    it('SELLER без магазина в DB → отказ', async () => {
      prisma.seller.findUnique.mockResolvedValue(null);
      const sock = makeSocket({ sub: 'user-1', role: 'SELLER' });
      await gateway.handleJoinSellerRoom({ storeId: 'store-1' }, sock);
      expect(calls(sock).joined).toEqual([]);
    });

    it('ошибка DB → fail-closed (отказ, без unhandled rejection)', async () => {
      prisma.seller.findUnique.mockRejectedValue(new Error('db down'));
      const sock = makeSocket({ sub: 'user-1', role: 'SELLER' });
      await expect(
        gateway.handleJoinSellerRoom({ storeId: 'store-1' }, sock),
      ).resolves.toBeUndefined();
      expect(calls(sock).joined).toEqual([]);
    });
  });

  describe('emitOrderStatusChangedToBuyer (API-WS-AUDIT-002 emit-side)', () => {
    const baseOrder: Record<string, unknown> = {
      id: 'ord-1',
      storeId: 'store-1',
      buyerId: 'buyer-1',           // Buyer.id, не User.id!
      status: 'CONFIRMED',
      totalAmount: 50000,
      currencyCode: 'UZS',
      deliveryFeeAmount: 0,
      placedAt: new Date('2026-05-12T10:00:00Z'),
    };

    it('резолвит Buyer.id → User.id перед emit', async () => {
      prisma.buyer.findUnique.mockResolvedValue({ userId: 'user-1' });
      await gateway.emitOrderStatusChangedToBuyer(baseOrder as never, 'PENDING');
      expect(prisma.buyer.findUnique).toHaveBeenCalledWith({
        where: { id: 'buyer-1' },
        select: { userId: true },
      });
      expect(server.to).toHaveBeenCalledWith('buyer:user-1');
      expect(emit).toHaveBeenCalledWith(
        'order:status_changed',
        expect.objectContaining({ id: 'ord-1', oldStatus: 'PENDING', status: 'CONFIRMED' }),
      );
    });

    it('buyer без userId → warn + skip emit', async () => {
      prisma.buyer.findUnique.mockResolvedValue({ userId: null });
      await gateway.emitOrderStatusChangedToBuyer(baseOrder as never, 'PENDING');
      expect(emit).not.toHaveBeenCalled();
    });

    it('order без buyerId → skip без DB-lookup', async () => {
      await gateway.emitOrderStatusChangedToBuyer({ ...baseOrder, buyerId: null } as unknown as never, 'PENDING');
      expect(prisma.buyer.findUnique).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });
});
