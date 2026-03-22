import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresRepository } from './repositories/stores.repository';
import { SlugService } from './services/slug.service';
import { StorePublicationService } from './services/store-publication.service';
import { CreateStoreUseCase } from './use-cases/create-store.use-case';
import { UpdateStoreUseCase } from './use-cases/update-store.use-case';
import { SubmitStoreForReviewUseCase } from './use-cases/submit-store-for-review.use-case';
import { PublishStoreUseCase } from './use-cases/publish-store.use-case';
import { UnpublishStoreUseCase } from './use-cases/unpublish-store.use-case';
import { SellersModule } from '../sellers/sellers.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SellersModule, AuthModule],
  controllers: [StoresController],
  providers: [
    StoresRepository,
    SlugService,
    StorePublicationService,
    CreateStoreUseCase,
    UpdateStoreUseCase,
    SubmitStoreForReviewUseCase,
    PublishStoreUseCase,
    UnpublishStoreUseCase,
  ],
  exports: [StoresRepository, SlugService],
})
export class StoresModule {}
