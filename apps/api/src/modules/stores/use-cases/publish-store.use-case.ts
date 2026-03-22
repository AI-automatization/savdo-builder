import { Injectable, HttpStatus } from '@nestjs/common';
import { StoresRepository } from '../repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class PublishStoreUseCase {
  constructor(
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(userId: string) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    if (seller.isBlocked) throw new DomainException(ErrorCode.SELLER_BLOCKED, 'Seller is blocked', HttpStatus.FORBIDDEN);

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);

    const approvalRequired = this.config.get<boolean>('features.storeApprovalRequired');

    if (approvalRequired && store.status !== 'APPROVED') {
      throw new DomainException(
        ErrorCode.STORE_NOT_APPROVED,
        'Store must be approved by admin before publishing',
        HttpStatus.FORBIDDEN,
      );
    }

    if (store.isPublic) {
      return store; // already public, idempotent
    }

    return this.storesRepo.update(store.id, {
      isPublic: true,
      publishedAt: store.publishedAt ?? new Date(),
    });
  }
}
