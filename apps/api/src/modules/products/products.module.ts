import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { StorefrontController } from './storefront.controller';
import { ProductPresenterService } from './services/product-presenter.service';
import { ProductsRepository } from './repositories/products.repository';
import { VariantsRepository } from './repositories/variants.repository';
import { OptionGroupsRepository } from './repositories/option-groups.repository';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';
import { ChangeProductStatusUseCase } from './use-cases/change-product-status.use-case';
import { DeleteProductUseCase } from './use-cases/delete-product.use-case';
import { CreateVariantUseCase } from './use-cases/create-variant.use-case';
import { UpdateVariantUseCase } from './use-cases/update-variant.use-case';
import { DeleteVariantUseCase } from './use-cases/delete-variant.use-case';
import { AdjustStockUseCase } from './use-cases/adjust-stock.use-case';
import { StoresModule } from '../stores/stores.module';
import { SellersModule } from '../sellers/sellers.module';
import { TelegramModule } from '../telegram/telegram.module';
import { WishlistModule } from '../wishlist/wishlist.module';

@Module({
  imports: [StoresModule, SellersModule, TelegramModule, WishlistModule],
  controllers: [ProductsController, StorefrontController],
  providers: [
    ProductsRepository,
    VariantsRepository,
    OptionGroupsRepository,
    ProductPresenterService,
    CreateProductUseCase,
    UpdateProductUseCase,
    ChangeProductStatusUseCase,
    DeleteProductUseCase,
    CreateVariantUseCase,
    UpdateVariantUseCase,
    DeleteVariantUseCase,
    AdjustStockUseCase,
  ],
  exports: [ProductsRepository, VariantsRepository, OptionGroupsRepository],
})
export class ProductsModule {}
