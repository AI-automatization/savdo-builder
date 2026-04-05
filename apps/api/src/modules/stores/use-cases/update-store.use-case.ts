import { Injectable, HttpStatus } from '@nestjs/common';
import { StoresRepository } from '../repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class UpdateStoreUseCase {
  constructor(
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
  ) {}

  async execute(userId: string, data: {
    name?: string;
    description?: string;
    city?: string;
    region?: string;
    telegramContactLink?: string;
    logoMediaId?: string;
    coverMediaId?: string;
    primaryGlobalCategoryId?: string;
    deliveryFeeType?: 'fixed' | 'manual' | 'none';
    deliveryFeeAmount?: number;
  }) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    if (seller.isBlocked) throw new DomainException(ErrorCode.SELLER_BLOCKED, 'Seller is blocked', HttpStatus.FORBIDDEN);

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);

    const { deliveryFeeType, deliveryFeeAmount, ...storeData } = data;

    const [updatedStore] = await Promise.all([
      this.storesRepo.update(store.id, storeData),
      (deliveryFeeType !== undefined || deliveryFeeAmount !== undefined)
        ? this.storesRepo.upsertDeliverySettings(store.id, {
            ...(deliveryFeeType !== undefined && { deliveryFeeType }),
            ...(deliveryFeeAmount !== undefined && { fixedDeliveryFee: deliveryFeeAmount }),
          })
        : Promise.resolve(),
    ]);

    return updatedStore;
  }
}
