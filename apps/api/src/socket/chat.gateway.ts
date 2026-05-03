import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '@prisma/client';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@WebSocketGateway({
  cors: {
    // Принимает любой *.up.railway.app + telegram + savdo.uz + список из ALLOWED_ORIGINS
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);
      const list = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [];
      if (list.includes(origin)) return cb(null, true);
      const patterns = [/\.railway\.app$/i, /(^|\.)telegram\.org$/i, /(^|\.)t\.me$/i, /(^|\.)savdo\.uz$/i];
      if (patterns.some((re) => re.test(new URL(origin).hostname))) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      this.logger.warn(`WS rejected: no token — client ${client.id}`);
      client.disconnect(true);
      return;
    }
    const payload = this.verifyToken(token);
    if (!payload) {
      this.logger.warn(`WS rejected: invalid token — client ${client.id}`);
      client.disconnect(true);
      return;
    }
    client.data.user = payload;
    this.logger.debug(`WS connected: userId=${payload.sub} role=${payload.role}`);
  }

  @SubscribeMessage('join-chat-room')
  handleJoinChatRoom(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!client.data.user) {
      client.disconnect(true);
      return;
    }
    const room = `thread:${data.threadId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leave-chat-room')
  handleLeaveChatRoom(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `thread:${data.threadId}`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} left room ${room}`);
  }

  emitChatMessage(message: ChatMessage & { mediaUrl?: string | null; parentMessage?: unknown }, senderRole: 'BUYER' | 'SELLER'): void {
    const payload = {
      id: message.id,
      threadId: message.threadId,
      text: message.body ?? '',
      senderRole,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt ? message.editedAt.toISOString() : null,
      messageType: message.messageType,
      mediaUrl: message.mediaUrl ?? null,
      parentMessage: message.parentMessage ?? null,
      isDeleted: message.isDeleted,
    };
    this.server.to(`thread:${message.threadId}`).emit('chat:message', payload);
    this.logger.log(`Emitted chat:message to thread:${message.threadId} — messageId=${message.id}`);
  }

  emitChatMessageEdited(message: ChatMessage): void {
    const payload = {
      id: message.id,
      threadId: message.threadId,
      text: message.body ?? '',
      editedAt: message.editedAt ? message.editedAt.toISOString() : null,
    };
    this.server.to(`thread:${message.threadId}`).emit('chat:message:edited', payload);
    this.logger.log(`Emitted chat:message:edited to thread:${message.threadId} — messageId=${message.id}`);
  }

  emitChatMessageDeleted(threadId: string, messageId: string): void {
    this.server.to(`thread:${threadId}`).emit('chat:message:deleted', { id: messageId, threadId });
    this.logger.log(`Emitted chat:message:deleted to thread:${threadId} — messageId=${messageId}`);
  }

  emitChatNewMessage(storeId: string, payload: { threadId: string; buyerName?: string }): void {
    this.server.to(`seller:${storeId}`).emit('chat:new_message', payload);
    this.logger.log(`Emitted chat:new_message to seller:${storeId} — threadId=${payload.threadId}`);
  }

  private verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
    } catch {
      return null;
    }
  }
}
