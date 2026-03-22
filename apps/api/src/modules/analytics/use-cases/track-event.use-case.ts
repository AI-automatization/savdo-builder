import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { TrackEventDto } from '../dto/track-event.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const ROLE_TO_ACTOR_TYPE: Record<string, string> = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

export interface TrackEventInput {
  dto: TrackEventDto;
  user?: JwtPayload;
}

@Injectable()
export class TrackEventUseCase {
  constructor(
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: TrackEventInput): Promise<void> {
    const analyticsEnabled = this.configService.get<boolean>('features.analyticsEnabled');
    if (!analyticsEnabled) {
      return;
    }

    const actorUserId = input.user?.sub ?? undefined;
    const actorType = input.user?.role
      ? (ROLE_TO_ACTOR_TYPE[input.user.role] ?? 'guest')
      : 'guest';

    await this.analyticsRepo.track({
      actorUserId,
      actorType,
      storeId: input.dto.storeId,
      eventName: input.dto.eventName,
      eventPayload: input.dto.eventPayload,
      sessionKey: input.dto.sessionKey,
    });
  }
}
