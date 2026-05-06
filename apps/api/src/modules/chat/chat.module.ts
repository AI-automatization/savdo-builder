import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatRepository } from './repositories/chat.repository';
import { CreateThreadUseCase } from './use-cases/create-thread.use-case';
import { SendMessageUseCase } from './use-cases/send-message.use-case';
import { GetThreadMessagesUseCase } from './use-cases/get-thread-messages.use-case';
import { ListMyThreadsUseCase } from './use-cases/list-my-threads.use-case';
import { ResolveThreadUseCase } from './use-cases/resolve-thread.use-case';
import { GetUnreadCountUseCase } from './use-cases/get-unread-count.use-case';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';
import { SocketModule } from '../../socket/socket.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [ProductsModule, OrdersModule, UsersModule, SellersModule, StoresModule, SocketModule, TelegramModule],
  controllers: [ChatController],
  providers: [
    ChatRepository,
    CreateThreadUseCase,
    SendMessageUseCase,
    GetThreadMessagesUseCase,
    ListMyThreadsUseCase,
    ResolveThreadUseCase,
    GetUnreadCountUseCase,
  ],
  exports: [ChatRepository],
})
export class ChatModule {}
