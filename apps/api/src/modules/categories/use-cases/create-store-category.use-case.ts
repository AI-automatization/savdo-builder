import { Injectable, HttpStatus } from '@nestjs/common';
import { StoreCategoriesRepository } from '../repositories/store-categories.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { StoreCategory } from '@prisma/client';

const STORE_CATEGORY_LIMIT = 20;

@Injectable()
export class CreateStoreCategoryUseCase {
  constructor(private readonly storeCategoriesRepo: StoreCategoriesRepository) {}

  async execute(
    storeId: string,
    data: { name: string; sortOrder?: number },
  ): Promise<StoreCategory> {
    const count = await this.storeCategoriesRepo.countByStoreId(storeId);
    if (count >= STORE_CATEGORY_LIMIT) {
      throw new DomainException(
        ErrorCode.STORE_CATEGORY_LIMIT,
        `Store cannot have more than ${STORE_CATEGORY_LIMIT} categories`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.storeCategoriesRepo.create(storeId, data);
  }
}
