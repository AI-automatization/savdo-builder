import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { UsersRepository } from '../users/repositories/users.repository';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { StoresRepository } from '../stores/repositories/stores.repository';
import { OrdersRepository } from './repositories/orders.repository';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetBuyerOrdersUseCase } from './use-cases/get-buyer-orders.use-case';
import { GetSellerOrdersUseCase } from './use-cases/get-seller-orders.use-case';
import { GetOrderDetailUseCase } from './use-cases/get-order-detail.use-case';
import { UpdateOrderStatusUseCase } from './use-cases/update-order-status.use-case';
import { MarkOrderPaidUseCase } from './use-cases/mark-order-paid.use-case';
import { mapOrderDetail } from './orders.mapper';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
    private readonly ordersRepo: OrdersRepository,
    private readonly getBuyerOrdersUseCase: GetBuyerOrdersUseCase,
    private readonly getSellerOrdersUseCase: GetSellerOrdersUseCase,
    private readonly getOrderDetailUseCase: GetOrderDetailUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly markOrderPaidUseCase: MarkOrderPaidUseCase,
  ) {}

  // ─── BUYER ROUTES ────────────────────────────────────────────────────────────

  // GET /api/v1/buyer/orders
  @Get('buyer/orders')
  @Roles('BUYER')
  async getBuyerOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListOrdersDto,
  ) {
    const buyerId = await this.resolveBuyerId(user.sub);
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 100);

    const result = await this.getBuyerOrdersUseCase.execute({
      userId: user.sub,
      buyerId,
      status: query.status,
      page,
      limit,
      // FEAT-ORDERS-ARCHIVE-001: ?archived=true → показать архив, иначе основной список.
      archived: query.archived === 'true',
    });

    // ARCH-DEBT as-any cleanup: use-case возвращает типизированный
    // PaginatedOrders { orders, total } — касты были лишние.
    const orders = result.orders ?? [];
    const total = result.total ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: orders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        storeId: o.storeId,
        status: o.status,
        totalAmount: Number(String(o.totalAmount)),
        deliveryFee: Number(String(o.deliveryFeeAmount ?? 0)),
        currencyCode: o.currencyCode ?? 'UZS',
        createdAt: (o.placedAt ?? o.createdAt ?? new Date()).toISOString(),
        customerPhone: o.customerPhone ?? undefined,
        customerFullName: o.customerFullName ?? undefined,
        // API-RESPONSE-TYPES-RECONCILE-001: число позиций в заказе.
        // `_count.items` уже включён в findByBuyerId — фронту больше не нужен `as`.
        itemCount: o._count?.items ?? (o.items?.length ?? 0),
        preview: o.items?.[0]
          ? { title: o.items[0].productTitleSnapshot, imageUrl: o.items[0].primaryImageUrlSnapshot ?? null, itemCount: o._count?.items ?? 1 }
          : null,
      })),
      meta: { total, page, limit, totalPages },
    };
  }

  // GET /api/v1/buyer/orders/:id
  @Get('buyer/orders/:id')
  @Roles('BUYER')
  async getBuyerOrderDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
  ) {
    const buyerId = await this.resolveBuyerId(user.sub);
    const order = await this.getOrderDetailUseCase.execute({ orderId, buyerId });
    return mapOrderDetail(order);
  }

  // PATCH /api/v1/buyer/orders/:id/status
  @Patch('buyer/orders/:id/status')
  @Roles('BUYER')
  async updateBuyerOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    if (dto.status !== OrderStatus.CANCELLED) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Buyers may only cancel orders',
        HttpStatus.FORBIDDEN,
      );
    }

    const buyerId = await this.resolveBuyerId(user.sub);
    return this.updateOrderStatusUseCase.execute({
      orderId,
      newStatus: dto.status,
      reason: dto.reason,
      actorRole: 'BUYER',
      actorUserId: user.sub,
      buyerId,
    });
  }

  // PATCH /api/v1/buyer/orders/:id/archive
  // FEAT-ORDERS-ARCHIVE-001: покупатель прячет/возвращает закрытый заказ.
  @Patch('buyer/orders/:id/archive')
  @Roles('BUYER')
  async archiveBuyerOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Body() body: { archived?: boolean },
  ) {
    const archived = body?.archived === true;
    const buyerId = await this.resolveBuyerId(user.sub);

    // Владение заказом проверяется здесь (buyer-scoped fetch бросит 404 на чужой).
    const order = await this.getOrderDetailUseCase.execute({ orderId, buyerId });

    // В архив можно только закрытые (DELIVERED/CANCELLED); возврат из архива — всегда.
    if (archived && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Only delivered or cancelled orders can be archived',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.ordersRepo.setBuyerArchived(orderId, archived ? new Date() : null);
    return { id: updated.id, archived: updated.buyerArchivedAt !== null };
  }

  // ─── SELLER ROUTES ───────────────────────────────────────────────────────────

  // GET /api/v1/seller/orders
  @Get('seller/orders')
  @Roles('SELLER')
  async getSellerOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListOrdersDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);

    return this.getSellerOrdersUseCase.execute({
      storeId,
      status: query.status,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
      archived: query.archived === 'true',
    });
  }

  // PATCH /api/v1/seller/orders/:id/archive
  @Patch('seller/orders/:id/archive')
  @Roles('SELLER')
  async archiveSellerOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Body() body: { archived?: boolean },
  ) {
    const archived = body?.archived === true;
    const storeId = await this.resolveStoreId(user.sub);

    // Владение заказом проверяется здесь (store-scoped fetch бросит 404 на чужой).
    const order = await this.getOrderDetailUseCase.execute({ orderId, storeId });

    // В архив можно только закрытые (DELIVERED/CANCELLED); возврат из архива — всегда.
    if (archived && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Only delivered or cancelled orders can be archived',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.ordersRepo.setSellerArchived(orderId, archived ? new Date() : null);
    return { id: updated.id, archived: updated.sellerArchivedAt !== null };
  }

  // GET /api/v1/seller/orders/:id
  @Get('seller/orders/:id')
  @Roles('SELLER')
  async getSellerOrderDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    const order = await this.getOrderDetailUseCase.execute({ orderId, storeId });
    return mapOrderDetail(order);
  }

  // PATCH /api/v1/seller/orders/:id/status
  @Patch('seller/orders/:id/status')
  @Roles('SELLER')
  async updateSellerOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.updateOrderStatusUseCase.execute({
      orderId,
      newStatus: dto.status,
      reason: dto.reason,
      actorRole: 'SELLER',
      actorUserId: user.sub,
      storeId,
    });
  }

  // POST /api/v1/seller/orders/:id/mark-paid
  @Post('seller/orders/:id/mark-paid')
  @Roles('SELLER')
  async markSellerOrderPaid(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    const updated = await this.markOrderPaidUseCase.execute({
      orderId,
      storeId,
      actorUserId: user.sub,
    });
    return { id: updated.id, paymentStatus: updated.paymentStatus };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async resolveBuyerId(userId: string): Promise<string> {
    const user = await this.usersRepo.findById(userId);

    if (!user || !user.buyer) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user.buyer.id;
  }

  private async resolveStoreId(userId: string): Promise<string> {
    const seller = await this.sellersRepo.findByUserId(userId);

    if (!seller) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Seller not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (seller.isBlocked) {
      throw new DomainException(
        ErrorCode.SELLER_BLOCKED,
        'Seller account is blocked',
        HttpStatus.FORBIDDEN,
      );
    }

    const store = await this.storesRepo.findBySellerId(seller.id);

    if (!store) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return store.id;
  }
}
