import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './repositories/orders.repository';
import { GetBuyerOrdersUseCase } from './use-cases/get-buyer-orders.use-case';
import { GetSellerOrdersUseCase } from './use-cases/get-seller-orders.use-case';
import { GetOrderDetailUseCase } from './use-cases/get-order-detail.use-case';
import { UpdateOrderStatusUseCase } from './use-cases/update-order-status.use-case';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
  imports: [UsersModule, SellersModule, StoresModule, SocketModule],
  controllers: [OrdersController],
  providers: [
    OrdersRepository,
    GetBuyerOrdersUseCase,
    GetSellerOrdersUseCase,
    GetOrderDetailUseCase,
    UpdateOrderStatusUseCase,
  ],
  exports: [OrdersRepository],
})
export class OrdersModule {}
