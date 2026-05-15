import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

import { AdminRepository } from './repositories/admin.repository';
import { AdminController } from './admin.controller';
import { AdminDbController } from './admin-db.controller';
import { AdminBroadcastController } from './admin-broadcast.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminOpsController } from './admin-ops.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminStoresController } from './admin-stores.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminSellersController } from './admin-sellers.controller';
import { AdminContextService } from './services/admin-context.service';
import { SuperAdminController } from './super-admin.controller';

import { ListUsersUseCase } from './use-cases/list-users.use-case';
import { GetUserDetailUseCase } from './use-cases/get-user-detail.use-case';
import { SuspendUserUseCase } from './use-cases/suspend-user.use-case';
import { UnsuspendUserUseCase } from './use-cases/unsuspend-user.use-case';
import { ListSellersUseCase } from './use-cases/list-sellers.use-case';
import { GetSellerDetailUseCase } from './use-cases/get-seller-detail.use-case';
import { ListStoresUseCase } from './use-cases/list-stores.use-case';
import { GetStoreDetailUseCase } from './use-cases/get-store-detail.use-case';
import { SuspendStoreUseCase } from './use-cases/suspend-store.use-case';
import { UnsuspendStoreUseCase } from './use-cases/unsuspend-store.use-case';
import { RejectStoreUseCase } from './use-cases/reject-store.use-case';
import { ArchiveStoreUseCase } from './use-cases/archive-store.use-case';
import { ApproveStoreUseCase } from './use-cases/approve-store.use-case';
import { UnapproveStoreUseCase } from './use-cases/unapprove-store.use-case';
import { SetStoreVerificationUseCase } from './use-cases/set-store-verification.use-case';
import { AdminCancelOrderUseCase } from './use-cases/admin-cancel-order.use-case';
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';
import { GetAnalyticsUseCase } from './use-cases/get-analytics.use-case';
import { BroadcastUseCase } from './use-cases/broadcast.use-case';
import { DbManagerUseCase } from './use-cases/db-manager.use-case';
import { AdminCreateSellerUseCase } from './use-cases/admin-create-seller.use-case';
import { AdminCreateStoreUseCase } from './use-cases/admin-create-store.use-case';
import { GetSystemHealthUseCase } from './use-cases/get-system-health.use-case';
import { AdminAuthUseCase } from './use-cases/admin-auth.use-case';
import { AdminUsersManagementUseCase } from './use-cases/admin-users-management.use-case';
import { RefundOrderUseCase } from './use-cases/refund-order.use-case';
import { VerifySellerExtendedUseCase } from './use-cases/verify-seller-extended.use-case';
import { MigrateTgMediaToR2UseCase } from './use-cases/migrate-tg-media-to-r2.use-case';
import { AuditBrokenMediaUrlsUseCase } from './use-cases/audit-broken-media-urls.use-case';
import { ActivateSellerOnMarketUseCase } from './use-cases/activate-seller-on-market.use-case';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../queues/queues.module';
import { TelegramModule } from '../telegram/telegram.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    UsersModule, SellersModule, StoresModule, ProductsModule, OrdersModule, AuthModule,
    TelegramModule,
    MediaModule,
    BullModule.registerQueue({ name: QUEUE_TELEGRAM_NOTIFICATIONS }),
  ],
  controllers: [
    AdminController,
    AdminDbController,
    AdminBroadcastController,
    AdminAnalyticsController,
    AdminOpsController,
    AdminProductsController,
    AdminStoresController,
    AdminUsersController,
    AdminSellersController,
    SuperAdminController,
  ],
  providers: [
    AdminRepository,
    AdminContextService,
    ListUsersUseCase,
    GetUserDetailUseCase,
    SuspendUserUseCase,
    UnsuspendUserUseCase,
    ListSellersUseCase,
    GetSellerDetailUseCase,
    ListStoresUseCase,
    GetStoreDetailUseCase,
    SuspendStoreUseCase,
    UnsuspendStoreUseCase,
    RejectStoreUseCase,
    ArchiveStoreUseCase,
    ApproveStoreUseCase,
    UnapproveStoreUseCase,
    SetStoreVerificationUseCase,
    AdminCancelOrderUseCase,
    GetAuditLogUseCase,
    GetAnalyticsUseCase,
    BroadcastUseCase,
    DbManagerUseCase,
    AdminCreateSellerUseCase,
    AdminCreateStoreUseCase,
    GetSystemHealthUseCase,
    AdminAuthUseCase,
    AdminUsersManagementUseCase,
    RefundOrderUseCase,
    VerifySellerExtendedUseCase,
    MigrateTgMediaToR2UseCase,
    AuditBrokenMediaUrlsUseCase,
    ActivateSellerOnMarketUseCase,
  ],
})
export class AdminModule {}
