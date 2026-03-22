import { Injectable, HttpStatus } from '@nestjs/common';
import { StoreCategoriesRepository } from '../repositories/store-categories.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { StoreCategory } from '@prisma/client';

@Injectable()
export class UpdateStoreCategoryUseCase {
  constructor(private readonly storeCategoriesRepo: StoreCategoriesRepository) {}

  async execute(
    id: string,
    storeId: string,
    data: { name?: string; sortOrder?: number },
  ): Promise<StoreCategory> {
    const category = await this.storeCategoriesRepo.findById(id);
    if (!category) {
      throw new DomainException(
        ErrorCode.CATEGORY_NOT_FOUND,
        'Category not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (category.storeId !== storeId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Category does not belong to your store',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.storeCategoriesRepo.update(id, data);
  }
}
