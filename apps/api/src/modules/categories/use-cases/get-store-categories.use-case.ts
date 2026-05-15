import { Injectable } from '@nestjs/common';
import {
  StoreCategoriesRepository,
  StoreCategoryWithCount,
} from '../repositories/store-categories.repository';

@Injectable()
export class GetStoreCategoriesUseCase {
  constructor(private readonly storeCategoriesRepo: StoreCategoriesRepository) {}

  async execute(storeId: string): Promise<StoreCategoryWithCount[]> {
    return this.storeCategoriesRepo.findByStoreId(storeId);
  }
}
