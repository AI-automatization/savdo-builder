import { Injectable, Logger } from '@nestjs/common';
import { AdminCreateSellerUseCase } from './admin-create-seller.use-case';
import { AdminCreateStoreUseCase } from './admin-create-store.use-case';
import { ApproveStoreUseCase } from './approve-store.use-case';
import { AdminRepository } from '../repositories/admin.repository';

export interface ActivateSellerOnMarketInput {
  actorUserId: string;
  targetUserId: string;
  fullName: string;
  sellerType: 'individual' | 'business';
  telegramUsername: string;
  storeName: string;
  storeCity: string;
  telegramContactLink: string;
  description?: string;
  region?: string;
  slug?: string;
}

/**
 * API-MANUAL-SELLER-ACTIVATION-001:
 * Объединяет 3 шага активации продавца в одно действие — для случая, когда
 * продавец связался с админом напрямую (без онлайн-оплаты, без онбординга).
 *
 * Решение Полата 06.05.2026: до открытия бизнес-счёта в Click/Payme монетизация
 * заморожена. Продавцы пишут в @savdo_builderBOT/админу → админ через
 * super-admin вручную открывает доступ к общему рынку.
 *
 * Раньше требовало 3 отдельных POST: make-seller → create-store → approve.
 * Теперь — один endpoint с одной audit-записью.
 *
 * Идемпотентность: каждый sub-use-case кидает CONFLICT если профиль уже есть.
 * Если make-seller прошёл а create-store упал — повторный вызов вернёт
 * CONFLICT на seller. Это OK: админ увидит ошибку и достанет seller через
 * `/admin/sellers/:id`, дальше создаст store отдельно.
 */
@Injectable()
export class ActivateSellerOnMarketUseCase {
  private readonly logger = new Logger(ActivateSellerOnMarketUseCase.name);

  constructor(
    private readonly createSeller: AdminCreateSellerUseCase,
    private readonly createStore: AdminCreateStoreUseCase,
    private readonly approveStore: ApproveStoreUseCase,
    private readonly adminRepo: AdminRepository,
  ) {}

  async execute(input: ActivateSellerOnMarketInput) {
    const seller = await this.createSeller.execute({
      userId: input.targetUserId,
      fullName: input.fullName,
      sellerType: input.sellerType,
      telegramUsername: input.telegramUsername,
    });

    const store = await this.createStore.execute({
      sellerId: seller.id,
      name: input.storeName,
      city: input.storeCity,
      telegramContactLink: input.telegramContactLink,
      description: input.description,
      region: input.region,
      slug: input.slug,
    });

    const approved = await this.approveStore.execute(store.id, input.actorUserId);

    // INV-A01: единая audit-запись для всего flow.
    await this.adminRepo.writeAuditLog({
      actorUserId: input.actorUserId,
      action: 'seller.activated_on_market',
      entityType: 'user',
      entityId: input.targetUserId,
      payload: {
        sellerId: seller.id,
        storeId: store.id,
        storeSlug: approved.slug,
        storeName: input.storeName,
      },
    });

    this.logger.log(
      `Seller activated on market: user=${input.targetUserId} seller=${seller.id} store=${store.id} (${approved.slug}) by admin=${input.actorUserId}`,
    );

    return { seller, store: approved };
  }
}
