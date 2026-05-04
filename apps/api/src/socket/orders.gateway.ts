import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../database/prisma.service';

@WebSocketGateway({
  cors: {
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
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
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
    // Verify storeId from JWT matches requested room (prevents joining another seller's room)
    if (user.storeId && user.storeId !== data.storeId) {
      this.logger.warn(`WS blocked: seller ${user.sub} tried to join wrong room seller:${data.storeId}`);
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

  async emitOrderStatusChangedToBuyer(order: Order, oldStatus: string): Promise<void> {
    if (!order.buyerId) return;
    // API-WS-AUDIT-002: web-buyer subscribes to room `buyer:{User.id}` (через
    // useAuth().user.id), но Order.buyerId — это Buyer.id (FK на Buyer table).
    // Без резолва на User.id buyer НИКОГДА не получает real-time order updates.
    const buyer = await this.prisma.buyer.findUnique({
      where: { id: order.buyerId },
      select: { userId: true },
    });
    if (!buyer?.userId) {
      this.logger.warn(`emitOrderStatusChangedToBuyer: buyer ${order.buyerId} has no userId — order ${order.id} skipped`);
      return;
    }
    const payload = { ...this.buildPayload(order), oldStatus };
    this.server.to(`buyer:${buyer.userId}`).emit('order:status_changed', payload);
    this.logger.log(`Emitted order:status_changed to buyer:${buyer.userId} (Buyer.id=${order.buyerId}) — orderId=${order.id} ${oldStatus}→${order.status}`);
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
