import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersGateway } from './orders.gateway';
import { ChatGateway } from './chat.gateway';
import { DatabaseModule } from '../database/prisma.module';

@Module({
  // DatabaseModule для PrismaService в ChatGateway (participant check на join-chat-room).
  imports: [JwtModule.register({}), DatabaseModule],
  providers: [OrdersGateway, ChatGateway],
  exports: [OrdersGateway, ChatGateway],
})
export class SocketModule {}
