import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaRepository } from './repositories/media.repository';
import { R2StorageService } from './services/r2-storage.service';
import { RequestUploadUseCase } from './use-cases/request-upload.use-case';
import { ConfirmUploadUseCase } from './use-cases/confirm-upload.use-case';
import { DeleteMediaUseCase } from './use-cases/delete-media.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [
    MediaRepository,
    R2StorageService,
    RequestUploadUseCase,
    ConfirmUploadUseCase,
    DeleteMediaUseCase,
  ],
  exports: [MediaRepository, R2StorageService],
})
export class MediaModule {}
