import { Injectable, HttpStatus } from '@nestjs/common';
import { StoreCategoriesRepository } from '../repositories/store-categories.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class DeleteStoreCategoryUseCase {
  constructor(private readonly storeCategoriesRepo: StoreCategoriesRepository) {}

  async execute(id: string, storeId: string): Promise<void> {
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

    await this.storeCategoriesRepo.delete(id);
  }
}
