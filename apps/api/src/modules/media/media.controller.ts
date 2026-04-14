import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Redirect,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequestUploadDto } from './dto/request-upload.dto';
import { RequestUploadUseCase } from './use-cases/request-upload.use-case';
import { ConfirmUploadUseCase } from './use-cases/confirm-upload.use-case';
import { DeleteMediaUseCase } from './use-cases/delete-media.use-case';
import { UploadDirectUseCase, UploadedFile as UploadedFileType } from './use-cases/upload-direct.use-case';
import { MediaRepository } from './repositories/media.repository';
import { TelegramStorageService } from './services/telegram-storage.service';
import { R2StorageService } from './services/r2-storage.service';

@Controller('media')
export class MediaController {
  constructor(
    private readonly requestUpload: RequestUploadUseCase,
    private readonly confirmUpload: ConfirmUploadUseCase,
    private readonly deleteMedia: DeleteMediaUseCase,
    private readonly uploadDirect: UploadDirectUseCase,
    private readonly mediaRepo: MediaRepository,
    private readonly tgStorage: TelegramStorageService,
    private readonly r2Storage: R2StorageService,
  ) {}

  // ─── Authenticated endpoints ────────────────────────────────────────────────

  /** Generate presigned R2 upload URL (when R2 is configured) */
  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  async getUploadUrl(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestUploadDto,
  ) {
    return this.requestUpload.execute(user.sub, dto);
  }

  /** Direct multipart upload → stored in Telegram channel */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileDirect(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedFileType,
    @Body('purpose') purpose: string,
  ) {
    return this.uploadDirect.execute(user.sub, file, purpose);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.confirmUpload.execute(id, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteMedia.execute(id, user.sub);
  }

  // ─── Public proxy (no auth — needed for displaying images to buyers) ────────

  /** Redirect to Telegram file URL (valid ~1h). Browser caches for 1h. */
  @Get('proxy/:id')
  @Redirect()
  async proxyFile(@Param('id') id: string) {
    const mediaFile = await this.mediaRepo.findById(id);

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    if (mediaFile.bucket === 'telegram' && mediaFile.objectKey.startsWith('tg:')) {
      const fileId = mediaFile.objectKey.slice(3);
      const url = await this.tgStorage.getFileUrl(fileId);
      return { url, statusCode: 302 };
    }

    // R2 or other storage — return public URL directly
    if (this.r2Storage.isConfigured()) {
      const url = this.r2Storage.getPublicUrl(mediaFile.objectKey);
      return { url, statusCode: 302 };
    }

    throw new NotFoundException('Storage not configured for this file');
  }

  // ─── Admin: list all media files ────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listMedia(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const files = await this.mediaRepo.findAll({ page: Number(page), limit: Number(limit) });
    return {
      data: files.map((f) => ({
        id: f.id,
        bucket: f.bucket,
        mimeType: f.mimeType,
        fileSize: Number(f.fileSize),
        visibility: f.visibility,
        createdAt: f.createdAt,
        url: f.bucket === 'telegram'
          ? `/api/v1/media/proxy/${f.id}`
          : this.r2Storage.getPublicUrl(f.objectKey),
      })),
      page: Number(page),
      limit: Number(limit),
    };
  }
}
