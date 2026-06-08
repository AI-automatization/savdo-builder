import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { StoresRepository } from '../repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { StorePublicationService } from '../services/store-publication.service';
import { ModerationTriggerService } from '../../moderation/services/moderation-trigger.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// API-STORE-DRAFT-REMOVAL-001: DRAFT в новой модели не используется как
// "ожидание submit" — магазин создаётся сразу в PENDING_REVIEW. Но оставлено
// в списке валидных source-статусов для legacy данных и для REJECTED →
// повторная отправка.
const ALLOWED_TO_SUBMIT = ['DRAFT', 'REJECTED', 'PENDING_REVIEW'];

@Injectable()
export class SubmitStoreForReviewUseCase {
  private readonly logger = new Logger(SubmitStoreForReviewUseCase.name);

  constructor(
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly publicationService: StorePublicationService,
    private readonly moderationTrigger: ModerationTriggerService,
  ) {}

  async execute(userId: string) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    if (seller.isBlocked) throw new DomainException(ErrorCode.SELLER_BLOCKED, 'Seller is blocked', HttpStatus.FORBIDDEN);

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);

    if (!ALLOWED_TO_SUBMIT.includes(store.status)) {
      throw new DomainException(
        ErrorCode.STORE_INVALID_TRANSITION,
        `Cannot submit store with status ${store.status} for review`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // INV-S03: minimum onboarding
    const storeWithSeller = { ...store, seller };
    if (!this.publicationService.isOnboardingComplete(storeWithSeller)) {
      throw new DomainException(
        ErrorCode.STORE_ONBOARDING_INCOMPLETE,
        'Please complete your store profile before submitting for review',
        HttpStatus.BAD_REQUEST,
        {
          required: ['name', 'city', 'telegramContactLink', 'seller.fullName', 'seller.telegramUsername'],
        },
      );
    }

    const updated = await this.storesRepo.update(store.id, { status: 'PENDING_REVIEW' });

    // API-STORE-MODERATION-NOT-TRIGGERED-001: раньше submit только менял status,
    // а ModerationCase не создавался — заявки терялись (админ не видел в очереди).
    // Идемпотентно: если case уже OPEN — переиспользуется.
    const moderationCase = await this.moderationTrigger.openCaseForStore(store.id);
    this.logger.log(
      `Store ${store.id} submitted for review by user=${userId} (case=${moderationCase.id})`,
    );

    return updated;
  }
}
