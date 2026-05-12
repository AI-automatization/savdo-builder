import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CartController } from './cart.controller';
import { CartRepository } from './repositories/cart.repository';
import { BuyerRepository } from './repositories/buyer.repository';
import { GetCartUseCase } from './use-cases/get-cart.use-case';
import { AddToCartUseCase } from './use-cases/add-to-cart.use-case';
import { UpdateCartItemUseCase } from './use-cases/update-cart-item.use-case';
import { RemoveFromCartUseCase } from './use-cases/remove-from-cart.use-case';
import { ClearCartUseCase } from './use-cases/clear-cart.use-case';
import { MergeGuestCartUseCase } from './use-cases/merge-guest-cart.use-case';
import { BulkMergeCartUseCase } from './use-cases/bulk-merge-cart.use-case';
import { ProductsModule } from '../products/products.module';
import { CartAbandonmentService } from './services/cart-abandonment.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../queues/queues.module';

@Module({
  imports: [
    ProductsModule,
    BullModule.registerQueue({ name: QUEUE_TELEGRAM_NOTIFICATIONS }),
  ],
  controllers: [CartController],
  providers: [
    CartRepository,
    BuyerRepository,
    GetCartUseCase,
    AddToCartUseCase,
    UpdateCartItemUseCase,
    RemoveFromCartUseCase,
    ClearCartUseCase,
    MergeGuestCartUseCase,
    BulkMergeCartUseCase,
    CartAbandonmentService,
  ],
  exports: [CartRepository],
})
export class CartModule {}
