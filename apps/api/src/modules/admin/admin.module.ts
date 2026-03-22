import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';
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
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';

@Module({
  imports: [UsersModule, SellersModule, StoresModule, AuthModule],
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
    GetAuditLogUseCase,
  ],
})
export class AdminModule {}
