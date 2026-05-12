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
  async handleJoinSellerRoom(
    @MessageBody() data: { storeId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = client.data.user as JwtPayload | undefined;
    if (user?.role !== 'SELLER') {
      client.disconnect(true);
      return;
    }
    if (!data?.storeId || typeof data.storeId !== 'string') {
      this.logger.warn(`WS join-seller-room rejected: invalid storeId from user ${user.sub}`);
      return;
    }

    // API-WS-AUDIT-001: жёсткая проверка владения магазином.
    // Раньше: `if (user.storeId && user.storeId !== data.storeId)` пропускал
    // SELLER'ов БЕЗ storeId в JWT — они могли join'нуться в чужие room и
    // получать events чужих заказов. Теперь — DB-lookup каждый раз.
    if (user.storeId === data.storeId) {
      const room = `seller:${data.storeId}`;
      client.join(room);
      this.logger.debug(`Client ${client.id} joined room ${room} (JWT match)`);
      return;
    }

    // JWT.storeId нет или не совпадает → проверяем владение через DB
    try {
      const seller = await this.prisma.seller.findUnique({
        where: { userId: user.sub },
        select: { store: { select: { id: true } } },
      });
      if (seller?.store?.id !== data.storeId) {
        this.logger.warn(
          `WS blocked: user ${user.sub} not owner of store ${data.storeId} (seller.store=${seller?.store?.id ?? 'none'})`,
        );
        return;
      }
      const room = `seller:${data.storeId}`;
      client.join(room);
      this.logger.debug(`Client ${client.id} (user ${user.sub}) joined room ${room} (DB verified)`);
    } catch (err) {
      this.logger.error(
        `WS join-seller-room failed for user ${user.sub} store ${data.storeId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  @SubscribeMessage('join-buyer-room')
  handleJoinBuyerRoom(
    @MessageBody() data: { buyerId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const user = client.data.user as JwtPayload | undefined;
    if (!user) {
      client.disconnect(true);
      return;
    }
    if (!data?.buyerId || typeof data.buyerId !== 'string') {
      this.logger.warn(`WS join-buyer-room rejected: invalid buyerId from user ${user.sub}`);
      return;
    }
    // buyer:{User.id} — клиент шлёт свой User.id, валидируем что совпадает.
    // Если БЫ хоть отдалённо могли пройти Buyer.id вместо User.id — fail
    // closed (не disconnect, чтоб не убивать переиспользование сокета).
    if (user.sub !== data.buyerId) {
      this.logger.warn(`WS join-buyer-room rejected: user ${user.sub} tried buyerId=${data.buyerId}`);
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
