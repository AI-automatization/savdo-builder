import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutRepository } from './repositories/checkout.repository';
import { PreviewCheckoutUseCase } from './use-cases/preview-checkout.use-case';
import { ConfirmCheckoutUseCase } from './use-cases/confirm-checkout.use-case';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CartModule, ProductsModule, UsersModule],
  controllers: [CheckoutController],
  providers: [
    CheckoutRepository,
    PreviewCheckoutUseCase,
    ConfirmCheckoutUseCase,
  ],
  exports: [CheckoutRepository],
})
export class CheckoutModule {}
