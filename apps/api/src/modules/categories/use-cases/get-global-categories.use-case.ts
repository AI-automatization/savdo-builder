import { Injectable } from '@nestjs/common';
import { GlobalCategoriesRepository } from '../repositories/global-categories.repository';
import { GlobalCategory } from '@prisma/client';

@Injectable()
export class GetGlobalCategoriesUseCase {
  constructor(private readonly globalCategoriesRepo: GlobalCategoriesRepository) {}

  async execute(): Promise<GlobalCategory[]> {
    return this.globalCategoriesRepo.findAllActive();
  }
}
