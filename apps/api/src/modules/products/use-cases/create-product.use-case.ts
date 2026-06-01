import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository, CreateProductData } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { Product } from '@prisma/client';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { PlanLimitGuardService } from '../../subscriptions/services/plan-limit-guard.service';

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly storesRepo: StoresRepository,
    private readonly planLimitGuard: PlanLimitGuardService,
  ) {}

  async execute(storeId: string, data: Omit<CreateProductData, 'storeId'>): Promise<Product> {
    if (data.basePrice <= 0) {
      throw new DomainException(
        ErrorCode.PRODUCT_PRICE_INVALID,
        'Price must be greater than 0',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Plan-limit hook: проверяем подписку/лимит товаров перед записью в БД.
    // storeId уже отрезолвлен контроллером — резолвим sellerId через StoresRepository.
    const store = await this.storesRepo.findById(storeId);
    if (!store) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.planLimitGuard.enforceProductsLimit(store.sellerId);

    return this.productsRepo.create({ ...data, storeId });
  }
}
