import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AnalyticsEvent } from '@prisma/client';

export interface TrackEventData {
  actorUserId?: string;
  actorType?: string;
  storeId?: string;
  eventName: string;
  eventPayload?: object;
  sessionKey?: string;
}

export interface FindEventsFilters {
  eventName?: string;
  storeId?: string;
  actorUserId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface FindEventsResult {
  events: AnalyticsEvent[];
  total: number;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Append-only — never UPDATE or DELETE
  async track(data: TrackEventData): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        actorUserId: data.actorUserId ?? null,
        actorType: data.actorType ?? null,
        storeId: data.storeId ?? null,
        eventName: data.eventName,
        eventPayload: (data.eventPayload ?? {}) as object,
        sessionKey: data.sessionKey ?? null,
      },
    });
  }

  async findEvents(filters: FindEventsFilters): Promise<FindEventsResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 100;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.eventName ? { eventName: filters.eventName } : {}),
      ...(filters.storeId ? { storeId: filters.storeId } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...((filters.from || filters.to)
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return { events, total };
  }
}
