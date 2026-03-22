import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsService } from './services/analytics.service';
import { TrackEventUseCase } from './use-cases/track-event.use-case';
import { QueryEventsUseCase } from './use-cases/query-events.use-case';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [AuthModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsRepository,
    AnalyticsService,
    TrackEventUseCase,
    QueryEventsUseCase,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
