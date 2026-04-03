import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatMessage } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  @SubscribeMessage('join-chat-room')
  handleJoinChatRoom(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `thread:${data.threadId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
  }

  emitChatMessage(message: ChatMessage): void {
    const payload = {
      id: message.id,
      threadId: message.threadId,
      senderUserId: message.senderUserId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };
    this.server.to(`thread:${message.threadId}`).emit('chat:message', payload);
    this.logger.log(`Emitted chat:message to thread:${message.threadId} — messageId=${message.id}`);
  }
}
