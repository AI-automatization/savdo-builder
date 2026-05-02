import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './repositories/wishlist.repository';
import { GetWishlistUseCase } from './use-cases/get-wishlist.use-case';
import { AddToWishlistUseCase } from './use-cases/add-to-wishlist.use-case';
import { RemoveFromWishlistUseCase } from './use-cases/remove-from-wishlist.use-case';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [WishlistController],
  providers: [
    WishlistRepository,
    GetWishlistUseCase,
    AddToWishlistUseCase,
    RemoveFromWishlistUseCase,
  ],
  exports: [WishlistRepository],
})
export class WishlistModule {}
