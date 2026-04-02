import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { OrdersCreateController } from './orders-create.controller';
import { CheckoutRepository } from './repositories/checkout.repository';
import { PreviewCheckoutUseCase } from './use-cases/preview-checkout.use-case';
import { ConfirmCheckoutUseCase } from './use-cases/confirm-checkout.use-case';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
  imports: [CartModule, ProductsModule, UsersModule, SocketModule],
  controllers: [CheckoutController, OrdersCreateController],
  providers: [
    CheckoutRepository,
    PreviewCheckoutUseCase,
    ConfirmCheckoutUseCase,
  ],
  exports: [CheckoutRepository],
})
export class CheckoutModule {}
