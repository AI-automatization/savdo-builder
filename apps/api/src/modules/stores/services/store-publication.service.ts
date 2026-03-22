import { Injectable } from '@nestjs/common';

@Injectable()
export class StorePublicationService {
  isOnboardingComplete(store: {
    name: string;
    city: string;
    telegramContactLink: string;
    seller: { fullName: string; telegramUsername: string };
  }): boolean {
    return !!(
      store.name?.trim() &&
      store.city?.trim() &&
      store.telegramContactLink?.trim() &&
      store.seller?.fullName?.trim() &&
      store.seller?.telegramUsername?.trim()
    );
  }
}
