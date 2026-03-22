import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationRepository } from './repositories/moderation.repository';
import { ModerationTriggerService } from './services/moderation-trigger.service';
import { GetModerationQueueUseCase } from './use-cases/get-moderation-queue.use-case';
import { GetCaseDetailUseCase } from './use-cases/get-case-detail.use-case';
import { TakeActionUseCase } from './use-cases/take-action.use-case';
import { AssignCaseUseCase } from './use-cases/assign-case.use-case';
import { StoresModule } from '../stores/stores.module';
import { SellersModule } from '../sellers/sellers.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [StoresModule, SellersModule, AuthModule],
  controllers: [ModerationController],
  providers: [
    ModerationRepository,
    ModerationTriggerService,
    GetModerationQueueUseCase,
    GetCaseDetailUseCase,
    TakeActionUseCase,
    AssignCaseUseCase,
  ],
  exports: [ModerationTriggerService],
})
export class ModerationModule {}
