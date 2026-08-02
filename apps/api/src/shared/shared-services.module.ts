import { Global, Module } from '@nestjs/common';
import { PlanLimitGuardService } from './plan-limit-guard.service';

/**
 * SharedServicesModule — @Global() module for cross-module services that depend
 * only on PrismaService (and other globals), without coupling to feature modules.
 *
 * Currently exports:
 *  - PlanLimitGuardService (BILLING-MACHINE-001) — used by ProductsModule
 *    (and future feature modules) to enforce subscription plan limits without
 *    importing SubscriptionsModule (which would create circular deps).
 */
@Global()
@Module({
  providers: [PlanLimitGuardService],
  exports: [PlanLimitGuardService],
})
export class SharedServicesModule {}
