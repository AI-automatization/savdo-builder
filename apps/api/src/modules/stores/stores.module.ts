import { Module, forwardRef } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresRepository } from './repositories/stores.repository';
import { SlugService } from './services/slug.service';
import { StorePublicationService } from './services/store-publication.service';
import { CreateStoreUseCase } from './use-cases/create-store.use-case';
import { UpdateStoreUseCase } from './use-cases/update-store.use-case';
import { SubmitStoreForReviewUseCase } from './use-cases/submit-store-for-review.use-case';
import { PublishStoreUseCase } from './use-cases/publish-store.use-case';
import { UnpublishStoreUseCase } from './use-cases/unpublish-store.use-case';
import { UpdateChannelTemplateUseCase } from './use-cases/update-channel-template.use-case';
import { TriggerChannelTestPostUseCase } from './use-cases/trigger-channel-test-post.use-case';
import { UpdateChannelBindingUseCase } from './use-cases/update-channel-binding.use-case';
import { SellersModule } from '../sellers/sellers.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { ModerationModule } from '../moderation/moderation.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    SellersModule,
    AuthModule,
    forwardRef(() => ProductsModule),
    forwardRef(() => ModerationModule),
    forwardRef(() => TelegramModule),
  ],
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
    UpdateChannelTemplateUseCase,
    TriggerChannelTestPostUseCase,
    UpdateChannelBindingUseCase,
  ],
  exports: [StoresRepository, SlugService],
})
export class StoresModule {}
