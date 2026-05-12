import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsService } from './services/analytics.service';
import { TrackEventUseCase } from './use-cases/track-event.use-case';
import { QueryEventsUseCase } from './use-cases/query-events.use-case';
import { GetSellerSummaryUseCase } from './use-cases/get-seller-summary.use-case';
import { GetSellerAnalyticsUseCase } from './use-cases/get-seller-analytics.use-case';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [AuthModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsRepository,
    AnalyticsService,
    TrackEventUseCase,
    QueryEventsUseCase,
    GetSellerSummaryUseCase,
    GetSellerAnalyticsUseCase,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
