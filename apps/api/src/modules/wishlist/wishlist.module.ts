import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './repositories/wishlist.repository';
import { GetWishlistUseCase } from './use-cases/get-wishlist.use-case';
import { AddToWishlistUseCase } from './use-cases/add-to-wishlist.use-case';
import { RemoveFromWishlistUseCase } from './use-cases/remove-from-wishlist.use-case';
import { UsersModule } from '../users/users.module';
import { WishlistNotifyService } from './services/wishlist-notify.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../queues/queues.module';

@Module({
  imports: [
    UsersModule,
    BullModule.registerQueue({ name: QUEUE_TELEGRAM_NOTIFICATIONS }),
  ],
  controllers: [WishlistController],
  providers: [
    WishlistRepository,
    GetWishlistUseCase,
    AddToWishlistUseCase,
    RemoveFromWishlistUseCase,
    WishlistNotifyService,
  ],
  exports: [WishlistRepository],
})
export class WishlistModule {}
