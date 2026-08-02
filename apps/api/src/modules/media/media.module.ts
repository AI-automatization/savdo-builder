import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { MediaRepository } from './repositories/media.repository';
import { R2StorageService } from './services/r2-storage.service';
import { TelegramStorageService } from './services/telegram-storage.service';
import { RequestUploadUseCase } from './use-cases/request-upload.use-case';
import { ConfirmUploadUseCase } from './use-cases/confirm-upload.use-case';
import { DeleteMediaUseCase } from './use-cases/delete-media.use-case';
import { UploadDirectUseCase } from './use-cases/upload-direct.use-case';
import { RemoveBackgroundUseCase } from './use-cases/remove-background.use-case';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SellersModule,
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  ],
  controllers: [MediaController],
  providers: [
    MediaRepository,
    R2StorageService,
    TelegramStorageService,
    RequestUploadUseCase,
    ConfirmUploadUseCase,
    DeleteMediaUseCase,
    UploadDirectUseCase,
    RemoveBackgroundUseCase,
  ],
  // UploadDirectUseCase: PARTNER-API-RAOS-001 — partner-модуль заливает
  // скачанные по URL фото тем же конвейером (sharp resize → R2 → MediaFile).
  exports: [MediaRepository, R2StorageService, TelegramStorageService, UploadDirectUseCase],
})
export class MediaModule {}
