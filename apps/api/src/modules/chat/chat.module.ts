import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatRepository } from './repositories/chat.repository';
import { CreateThreadUseCase } from './use-cases/create-thread.use-case';
import { SendMessageUseCase } from './use-cases/send-message.use-case';
import { GetThreadMessagesUseCase } from './use-cases/get-thread-messages.use-case';
import { ListMyThreadsUseCase } from './use-cases/list-my-threads.use-case';
import { ResolveThreadUseCase } from './use-cases/resolve-thread.use-case';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [ProductsModule, OrdersModule, UsersModule, SellersModule, StoresModule],
  controllers: [ChatController],
  providers: [
    ChatRepository,
    CreateThreadUseCase,
    SendMessageUseCase,
    GetThreadMessagesUseCase,
    ListMyThreadsUseCase,
    ResolveThreadUseCase,
  ],
  exports: [ChatRepository],
})
export class ChatModule {}
