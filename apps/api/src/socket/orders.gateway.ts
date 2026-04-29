import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  },
})
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

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

  @SubscribeMessage('join-seller-room')
  handleJoinSellerRoom(
    @MessageBody() data: { storeId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const user = client.data.user as JwtPayload | undefined;
    if (user?.role !== 'SELLER') {
      client.disconnect(true);
      return;
    }
    const room = `seller:${data.storeId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('join-buyer-room')
  handleJoinBuyerRoom(
    @MessageBody() data: { buyerId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const user = client.data.user as JwtPayload | undefined;
    if (!user || user.sub !== data.buyerId) {
      client.disconnect(true);
      return;
    }
    const room = `buyer:${data.buyerId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
  }

  emitOrderNew(order: Order): void {
    const payload = this.buildPayload(order);
    this.server.to(`seller:${order.storeId}`).emit('order:new', payload);
    this.logger.log(`Emitted order:new to seller:${order.storeId} — orderId=${order.id}`);
  }

  emitOrderStatusChanged(order: Order, oldStatus: string): void {
    const payload = { ...this.buildPayload(order), oldStatus };
    this.server.to(`seller:${order.storeId}`).emit('order:status_changed', payload);
    this.logger.log(`Emitted order:status_changed to seller:${order.storeId} — orderId=${order.id} ${oldStatus}→${order.status}`);
  }

  emitOrderStatusChangedToBuyer(order: Order, oldStatus: string): void {
    if (!order.buyerId) return;
    const payload = { ...this.buildPayload(order), oldStatus };
    this.server.to(`buyer:${order.buyerId}`).emit('order:status_changed', payload);
    this.logger.log(`Emitted order:status_changed to buyer:${order.buyerId} — orderId=${order.id} ${oldStatus}→${order.status}`);
  }

  private buildPayload(order: Order) {
    return {
      id: order.id,
      storeId: order.storeId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      currencyCode: order.currencyCode,
      deliveryFee: Number(order.deliveryFeeAmount),
      createdAt: order.placedAt.toISOString(),
    };
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
