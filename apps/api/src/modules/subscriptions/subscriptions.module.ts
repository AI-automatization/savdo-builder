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
import { CompSubscriptionUseCase } from './use-cases/comp-subscription.use-case';
import { BackfillTrialsUseCase } from './use-cases/backfill-trials.use-case';
import { ExpireSubscriptionsUseCase } from './use-cases/expire-subscriptions.use-case';
import { SubscriptionExpiryProcessor } from './processors/subscription-expiry.processor';
// PlanLimitGuardService moved to shared/ (Global) to avoid circular deps.
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';

/**
 * SubscriptionsModule — BILLING-MACHINE-001.
 * Регистрирует оба controller'а (seller + admin) тут чтобы избежать circular deps с AdminModule.
 * AdminModule exports AdminRepository — нужен для writeAuditLog в use-cases.
 */
@Module({
  imports: [SellersModule, StoresModule, AuthModule, AdminModule],
  controllers: [SubscriptionsController, AdminSubscriptionsController],
  providers: [
    SubscriptionsRepository,
    SubscriptionPaymentsRepository,
    StartTrialUseCase,
    GetCurrentSubscriptionUseCase,
    MarkPaidUseCase,
    ExtendTrialUseCase,
    CancelSubscriptionUseCase,
    CompSubscriptionUseCase,
    BackfillTrialsUseCase,
    ExpireSubscriptionsUseCase,
    SubscriptionExpiryProcessor,
  ],
  exports: [
    SubscriptionsRepository,
    SubscriptionPaymentsRepository,
    StartTrialUseCase,
    MarkPaidUseCase,
    ExtendTrialUseCase,
    CancelSubscriptionUseCase,
    CompSubscriptionUseCase,
    BackfillTrialsUseCase,
    ExpireSubscriptionsUseCase,
  ],
})
export class SubscriptionsModule {}
