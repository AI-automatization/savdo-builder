import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { GlobalCategoriesRepository } from './repositories/global-categories.repository';
import { StoreCategoriesRepository } from './repositories/store-categories.repository';
import { GetGlobalCategoriesUseCase } from './use-cases/get-global-categories.use-case';
import { GetStoreCategoriesUseCase } from './use-cases/get-store-categories.use-case';
import { CreateStoreCategoryUseCase } from './use-cases/create-store-category.use-case';
import { UpdateStoreCategoryUseCase } from './use-cases/update-store-category.use-case';
import { DeleteStoreCategoryUseCase } from './use-cases/delete-store-category.use-case';
import { GlobalCategoriesSeedService } from './global-categories-seed.service';
import { StoresModule } from '../stores/stores.module';
import { SellersModule } from '../sellers/sellers.module';

@Module({
  imports: [StoresModule, SellersModule],
  controllers: [CategoriesController],
  providers: [
    GlobalCategoriesRepository,
    StoreCategoriesRepository,
    GetGlobalCategoriesUseCase,
    GetStoreCategoriesUseCase,
    CreateStoreCategoryUseCase,
    UpdateStoreCategoryUseCase,
    DeleteStoreCategoryUseCase,
    GlobalCategoriesSeedService,
  ],
})
export class CategoriesModule {}
