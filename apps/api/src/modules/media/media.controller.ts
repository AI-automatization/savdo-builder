import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { MediaVisibility } from '@prisma/client';
import { RequestUploadDto } from './dto/request-upload.dto';
import { RequestUploadUseCase } from './use-cases/request-upload.use-case';
import { ConfirmUploadUseCase } from './use-cases/confirm-upload.use-case';
import { DeleteMediaUseCase } from './use-cases/delete-media.use-case';
import { UploadDirectUseCase, UploadedFile as UploadedFileType } from './use-cases/upload-direct.use-case';
import { MediaRepository } from './repositories/media.repository';
import { TelegramStorageService } from './services/telegram-storage.service';
import { R2StorageService } from './services/r2-storage.service';
import { PrismaService } from '../../database/prisma.service';

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
    private readonly prisma: PrismaService,
  ) {}

  // ─── Authenticated endpoints ────────────────────────────────────────────────

  /** Generate presigned R2 upload URL (when R2 is configured) */
  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async getUploadUrl(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestUploadDto,
  ) {
    return this.requestUpload.execute(user.sub, dto);
  }

  /** Direct multipart upload → stored in Telegram channel */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } }) // защита от bandwidth-spam
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileDirect(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedFileType,
    @Body('purpose') purpose: string,
  ) {
    return this.uploadDirect.execute(user.sub, file, purpose);
  }

  /** Upload buyer avatar — image only, max 10 MB */
  @Post('buyer/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBuyerAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedFileType,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { url } = await this.uploadDirect.execute(user.sub, file, 'buyer_avatar');

    const buyer = await this.prisma.buyer.upsert({
      where: { userId: user.sub },
      create: { userId: user.sub, avatarUrl: url },
      update: { avatarUrl: url },
      select: { id: true, avatarUrl: true },
    });

    return { success: true, data: { avatarUrl: buyer.avatarUrl } };
  }

  /** Upload seller avatar — image only, max 10 MB */
  @Post('seller/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSellerAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedFileType,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { url } = await this.uploadDirect.execute(user.sub, file, 'seller_avatar');

    const seller = await this.prisma.seller.update({
      where: { userId: user.sub },
      data: { avatarUrl: url },
      select: { id: true, avatarUrl: true },
    });

    return { success: true, data: { avatarUrl: seller.avatarUrl } };
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

  // SEC-TG-001: Telegram файлы стримятся через сервер, чтобы Bot Token не попал
  // в Location-заголовок. R2 публичный CDN — там redirect остаётся.
  @Get('proxy/:id')
  async proxyFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const mediaFile = await this.mediaRepo.findById(id);

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    // SEC-005: only serve public files via unauthenticated proxy
    if (mediaFile.visibility !== MediaVisibility.PUBLIC) {
      throw new NotFoundException('Media file not found');
    }

    if (mediaFile.bucket === 'telegram' && mediaFile.objectKey.startsWith('tg:')) {
      const fileId = mediaFile.objectKey.slice(3);
      // SEC-TG-001: стрим через сервер — bot token остаётся server-side.
      await this.tgStorage.streamToResponse(fileId, mediaFile.mimeType, res);
      return;
    }

    // API-BUCKET-NAME-CONSISTENCY-001: 'telegram-expired' выставляется migration
    // когда TG getFile вернул 404 → файл навсегда мёртв. Не пытаемся redirect.
    if (mediaFile.bucket === 'telegram-expired') {
      throw new NotFoundException('Media file expired (please re-upload)');
    }

    if (this.r2Storage.isConfigured()) {
      const url = this.r2Storage.getPublicUrl(mediaFile.objectKey);
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.redirect(302, url);
      return;
    }

    throw new NotFoundException('Storage not configured for this file');
  }

  // ─── SEC-005: Private file access (JWT-protected) ──────────────────────────
  // Для документов продавцов (seller_doc, visibility=PROTECTED) — доступ только
  // владельцу или ADMIN. Используется в admin-панели для просмотра доков
  // и в seller-cabinet чтобы продавец видел свои собственные документы.
  @Get('private/:id')
  @UseGuards(JwtAuthGuard)
  async privateFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const mediaFile = await this.mediaRepo.findById(id);

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    // PUBLIC файлы тут не отдаём — для них есть /proxy
    if (mediaFile.visibility === MediaVisibility.PUBLIC) {
      throw new NotFoundException('Use /proxy for public files');
    }

    // Доступ: ADMIN всегда, иначе только владелец
    const isAdmin = user.role === 'ADMIN';
    const isOwner = mediaFile.ownerUserId === user.sub;
    if (!isAdmin && !isOwner) {
      throw new NotFoundException('Media file not found');
    }

    if (mediaFile.bucket === 'telegram' && mediaFile.objectKey.startsWith('tg:')) {
      const fileId = mediaFile.objectKey.slice(3);
      // SEC-TG-001: стрим через сервер — bot token остаётся server-side.
      await this.tgStorage.streamToResponse(fileId, mediaFile.mimeType, res);
      return;
    }

    // API-BUCKET-NAME-CONSISTENCY-001: 'telegram-expired' = мёртвый file_id.
    if (mediaFile.bucket === 'telegram-expired') {
      throw new NotFoundException('Media file expired (please re-upload)');
    }

    if (this.r2Storage.isConfigured()) {
      // Private files: stream через сервер (не редирект на public URL)
      // чтобы CDN не закешировал чужой документ.
      const url = this.r2Storage.getPublicUrl(mediaFile.objectKey);
      res.setHeader('Cache-Control', 'private, no-store');
      res.redirect(302, url);
      return;
    }

    throw new NotFoundException('Storage not configured for this file');
  }

  // ─── Admin: list all media files ────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard, AdminPermissionGuard)
  @Roles('ADMIN')
  @AdminPermission('media:read')
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
