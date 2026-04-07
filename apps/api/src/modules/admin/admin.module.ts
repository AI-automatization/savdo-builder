import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

import { AdminRepository } from './repositories/admin.repository';
import { AdminController } from './admin.controller';

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
import { AdminCancelOrderUseCase } from './use-cases/admin-cancel-order.use-case';
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';
import { GetAnalyticsUseCase } from './use-cases/get-analytics.use-case';
import { BroadcastUseCase } from './use-cases/broadcast.use-case';
import { DbManagerUseCase } from './use-cases/db-manager.use-case';
import { AdminCreateSellerUseCase } from './use-cases/admin-create-seller.use-case';
import { AdminCreateStoreUseCase } from './use-cases/admin-create-store.use-case';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../queues/queues.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    UsersModule, SellersModule, StoresModule, ProductsModule, OrdersModule, AuthModule,
    TelegramModule,
    BullModule.registerQueue({ name: QUEUE_TELEGRAM_NOTIFICATIONS }),
  ],
  controllers: [AdminController],
  providers: [
    AdminRepository,
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
    AdminCancelOrderUseCase,
    GetAuditLogUseCase,
    GetAnalyticsUseCase,
    BroadcastUseCase,
    DbManagerUseCase,
    AdminCreateSellerUseCase,
    AdminCreateStoreUseCase,
  ],
})
export class AdminModule {}
