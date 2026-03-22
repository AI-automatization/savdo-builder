import { Injectable } from '@nestjs/common';
import { StoreCategoriesRepository } from '../repositories/store-categories.repository';
import { StoreCategory } from '@prisma/client';

@Injectable()
export class GetStoreCategoriesUseCase {
  constructor(private readonly storeCategoriesRepo: StoreCategoriesRepository) {}

  async execute(storeId: string): Promise<StoreCategory[]> {
    return this.storeCategoriesRepo.findByStoreId(storeId);
  }
}
