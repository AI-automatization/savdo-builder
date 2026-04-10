import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersRepository } from './repositories/sellers.repository';
import { UpdateSellerProfileUseCase } from './use-cases/update-seller-profile.use-case';
import { ApplySellerUseCase } from './use-cases/apply-seller.use-case';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [SellersController],
  providers: [SellersRepository, UpdateSellerProfileUseCase, ApplySellerUseCase],
  exports: [SellersRepository],
})
export class SellersModule {}
