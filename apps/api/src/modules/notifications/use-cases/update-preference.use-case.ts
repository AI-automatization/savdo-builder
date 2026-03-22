import { Injectable } from '@nestjs/common';
import { NotificationPreference } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import { UpdatePreferenceDto } from '../dto/update-preference.dto';

export interface UpdatePreferenceInput {
  userId: string;
  dto: UpdatePreferenceDto;
}

@Injectable()
export class UpdatePreferenceUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(input: UpdatePreferenceInput): Promise<NotificationPreference> {
    return this.notificationRepo.upsertPreferences(input.userId, {
      mobilePushEnabled: input.dto.mobilePushEnabled,
      webPushEnabled: input.dto.webPushEnabled,
      telegramEnabled: input.dto.telegramEnabled,
    });
  }
}
