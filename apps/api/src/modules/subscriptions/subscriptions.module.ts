import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { AdminSubscriptionsController } from '../admin/admin-subscriptions.controller';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { SubscriptionPaymentsRepository } from './repositories/subscription-payments.repository';
import { StartTrialUseCase } from './use-cases/start-trial.use-case';
import { GetCurrentSubscriptionUseCase } from './use-cases/get-current-subscription.use-case';
import { MarkPaidUseCase } from './use-cases/mark-paid.use-case';
import { ExtendTrialUseCase } from './use-cases/extend-trial.use-case';
import { CancelSubscriptionUseCase } from './use-cases/cancel-subscription.use-case';
import { ExpireSubscriptionsUseCase } from './use-cases/expire-subscriptions.use-case';
import { SellersModule } from '../sellers/sellers.module';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';

/**
 * SubscriptionsModule — BILLING-MACHINE-001.
 * Регистрирует оба controller'а (seller + admin) тут чтобы избежать circular deps с AdminModule.
 * AdminModule exports AdminRepository — нужен для writeAuditLog в use-cases.
 */
@Module({
  imports: [SellersModule, AuthModule, AdminModule],
  controllers: [SubscriptionsController, AdminSubscriptionsController],
  providers: [
    SubscriptionsRepository,
    SubscriptionPaymentsRepository,
    StartTrialUseCase,
    GetCurrentSubscriptionUseCase,
    MarkPaidUseCase,
    ExtendTrialUseCase,
    CancelSubscriptionUseCase,
    ExpireSubscriptionsUseCase,
  ],
  exports: [
    SubscriptionsRepository,
    SubscriptionPaymentsRepository,
    StartTrialUseCase,
    MarkPaidUseCase,
    ExtendTrialUseCase,
    CancelSubscriptionUseCase,
    ExpireSubscriptionsUseCase,
  ],
})
export class SubscriptionsModule {}
