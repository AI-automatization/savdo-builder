import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { StoresRepository } from '../repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { SlugService } from '../services/slug.service';
import { ModerationTriggerService } from '../../moderation/services/moderation-trigger.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { normalizeContactLink, normalizeCity } from '../../../shared/normalize';

@Injectable()
export class CreateStoreUseCase {
  private readonly logger = new Logger(CreateStoreUseCase.name);

  constructor(
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly slugService: SlugService,
    private readonly moderationTrigger: ModerationTriggerService,
  ) {}

  async execute(userId: string, data: {
    name: string;
    slug?: string;
    description?: string;
    city: string;
    region?: string;
    telegramContactLink: string;
  }) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    if (seller.isBlocked) {
      throw new DomainException(ErrorCode.SELLER_BLOCKED, 'Seller is blocked', HttpStatus.FORBIDDEN);
    }

    // INV-S01: one store per seller
    const existing = await this.storesRepo.findBySellerId(seller.id);
    if (existing) {
      throw new DomainException(
        ErrorCode.STORE_ALREADY_EXISTS,
        'Seller already has a store',
        HttpStatus.CONFLICT,
      );
    }

    // Slug: use provided or auto-generate unique
    let slug = data.slug;
    if (slug) {
      const taken = await this.storesRepo.existsBySlug(slug);
      if (taken) {
        throw new DomainException(ErrorCode.STORE_SLUG_TAKEN, 'This slug is already taken', HttpStatus.CONFLICT);
      }
    } else {
      slug = await this.slugService.generateUnique(data.name);
    }

    // API-TELEGRAM-LINK-EMPTY-001: trim и сохранять "" вместо null
    // (DB schema требует non-null). Frontend увидит null после normalize в presenter.
    const telegramContactLink = normalizeContactLink(data.telegramContactLink) ?? '';

    // API-CITY-NORMALIZATION-001: канонический uz-Latin (Toshkent, Samarqand, ...).
    const city = normalizeCity(data.city);

    const store = await this.storesRepo.create({
      sellerId: seller.id, ...data, slug, telegramContactLink, city,
    });

    // API-STORE-MODERATION-NOT-TRIGGERED-001: seller только что создал магазин,
    // schema default = PENDING_REVIEW (см. миграцию 20260608100000). Сразу
    // открываем moderation case — иначе магазин будет PENDING_REVIEW, но
    // не появится в очереди модерации, и админ его не увидит.
    const moderationCase = await this.moderationTrigger.openCaseForStore(store.id);
    this.logger.log(
      `Store ${store.id} created by user=${userId} → moderation case ${moderationCase.id}`,
    );

    return store;
  }
}
