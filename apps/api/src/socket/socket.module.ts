import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersGateway } from './orders.gateway';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [JwtModule.register({})],
  providers: [OrdersGateway, ChatGateway],
  exports: [OrdersGateway, ChatGateway],
})
export class SocketModule {}
