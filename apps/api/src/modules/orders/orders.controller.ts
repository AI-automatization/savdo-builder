import {
  Controller,
  Get,
  Patch,
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
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetBuyerOrdersUseCase } from './use-cases/get-buyer-orders.use-case';
import { GetSellerOrdersUseCase } from './use-cases/get-seller-orders.use-case';
import { GetOrderDetailUseCase } from './use-cases/get-order-detail.use-case';
import { UpdateOrderStatusUseCase } from './use-cases/update-order-status.use-case';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
    private readonly getBuyerOrdersUseCase: GetBuyerOrdersUseCase,
    private readonly getSellerOrdersUseCase: GetSellerOrdersUseCase,
    private readonly getOrderDetailUseCase: GetOrderDetailUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
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

    return this.getBuyerOrdersUseCase.execute({
      userId: user.sub,
      buyerId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  // GET /api/v1/orders/:id — alias for buyer/orders/:id
  @Get('orders/:id')
  @Roles('BUYER')
  async getOrderById(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
  ) {
    const buyerId = await this.resolveBuyerId(user.sub);
    return this.getOrderDetailUseCase.execute({ orderId, buyerId });
  }

  // GET /api/v1/buyer/orders/:id
  @Get('buyer/orders/:id')
  @Roles('BUYER')
  async getBuyerOrderDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
  ) {
    const buyerId = await this.resolveBuyerId(user.sub);

    return this.getOrderDetailUseCase.execute({ orderId, buyerId });
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

    return this.updateOrderStatusUseCase.execute({
      orderId,
      newStatus: dto.status,
      reason: dto.reason,
      actorRole: 'BUYER',
      actorUserId: user.sub,
    });
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
    });
  }

  // GET /api/v1/seller/orders/:id
  @Get('seller/orders/:id')
  @Roles('SELLER')
  async getSellerOrderDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);

    return this.getOrderDetailUseCase.execute({ orderId, storeId });
  }

  // PATCH /api/v1/seller/orders/:id/status
  @Patch('seller/orders/:id/status')
  @Roles('SELLER')
  async updateSellerOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.updateOrderStatusUseCase.execute({
      orderId,
      newStatus: dto.status,
      reason: dto.reason,
      actorRole: 'SELLER',
      actorUserId: user.sub,
    });
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
