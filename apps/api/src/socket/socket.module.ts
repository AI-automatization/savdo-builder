import { Module } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { ChatGateway } from './chat.gateway';

@Module({
  providers: [OrdersGateway, ChatGateway],
  exports: [OrdersGateway, ChatGateway],
})
export class SocketModule {}
