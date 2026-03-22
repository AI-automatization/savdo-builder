import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsRepository, TrackEventData } from '../repositories/analytics.repository';
import { AnalyticsEvent as AnalyticsEventNames } from '../../../shared/constants/analytics-events';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Fire-and-forget event ingestion.
   * Checks analyticsEnabled flag before writing.
   * Never throws — errors are swallowed to prevent analytics from breaking callers.
   */
  track(data: TrackEventData): void {
    const analyticsEnabled = this.configService.get<boolean>('features.analyticsEnabled');
    if (!analyticsEnabled) {
      return;
    }

    this.analyticsRepo.track(data).catch((err: unknown) => {
      this.logger.error('Failed to track analytics event', { eventName: data.eventName, err });
    });
  }

  // ─── Convenience methods ───────────────────────────────────────────────────

  trackOrderCreated(
    orderId: string,
    storeId: string,
    buyerUserId?: string,
    amount?: number,
  ): void {
    this.track({
      actorUserId: buyerUserId,
      actorType: buyerUserId ? 'buyer' : 'guest',
      storeId,
      eventName: AnalyticsEventNames.ORDER_CREATED,
      eventPayload: { orderId, amount },
    });
  }

  trackStorePublished(storeId: string, sellerUserId: string): void {
    this.track({
      actorUserId: sellerUserId,
      actorType: 'seller',
      storeId,
      eventName: AnalyticsEventNames.STORE_PUBLISHED,
      eventPayload: { storeId },
    });
  }

  trackSellerRegistered(sellerUserId: string): void {
    this.track({
      actorUserId: sellerUserId,
      actorType: 'seller',
      eventName: AnalyticsEventNames.SIGNUP_STARTED,
      eventPayload: { sellerUserId },
    });
  }
}
