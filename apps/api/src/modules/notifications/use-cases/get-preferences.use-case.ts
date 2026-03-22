import { Injectable } from '@nestjs/common';
import { NotificationPreference } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';

export interface GetPreferencesResult {
  mobilePushEnabled: boolean;
  webPushEnabled: boolean;
  telegramEnabled: boolean;
}

@Injectable()
export class GetPreferencesUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(userId: string): Promise<GetPreferencesResult> {
    const prefs = await this.notificationRepo.findPreferences(userId);

    // Return schema defaults when no row exists yet for this user.
    if (!prefs) {
      return {
        mobilePushEnabled: true,
        webPushEnabled: false,
        telegramEnabled: true,
      };
    }

    return {
      mobilePushEnabled: prefs.mobilePushEnabled,
      webPushEnabled: prefs.webPushEnabled,
      telegramEnabled: prefs.telegramEnabled,
    };
  }
}
