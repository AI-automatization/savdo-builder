import { Injectable } from '@nestjs/common';
import { AnalyticsRepository, FindEventsResult } from '../repositories/analytics.repository';
import { QueryEventsDto } from '../dto/query-events.dto';

@Injectable()
export class QueryEventsUseCase {
  constructor(private readonly analyticsRepo: AnalyticsRepository) {}

  async execute(dto: QueryEventsDto): Promise<FindEventsResult> {
    return this.analyticsRepo.findEvents({
      eventName: dto.eventName,
      storeId: dto.storeId,
      actorUserId: dto.actorUserId,
      from: dto.from ? new Date(dto.from) : undefined,
      to: dto.to ? new Date(dto.to) : undefined,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
