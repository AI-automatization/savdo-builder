import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Order } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  },
})
export class OrdersGateway {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  @SubscribeMessage('join-seller-room')
  handleJoinSellerRoom(
    @MessageBody() data: { storeId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `seller:${data.storeId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
  }

  emitOrderNew(order: Order): void {
    const payload = this.buildPayload(order);
    this.server.to(`seller:${order.storeId}`).emit('order:new', payload);
    this.logger.log(`Emitted order:new to seller:${order.storeId} — orderId=${order.id}`);
  }

  @SubscribeMessage('join-buyer-room')
  handleJoinBuyerRoom(
    @MessageBody() data: { buyerId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `buyer:${data.buyerId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
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
}
