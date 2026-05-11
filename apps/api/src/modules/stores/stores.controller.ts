import { Controller, Get, Post, Patch, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ReplaceDirectionsDto } from './dto/replace-directions.dto';
import { CreateStoreUseCase } from './use-cases/create-store.use-case';
import { UpdateStoreUseCase } from './use-cases/update-store.use-case';
import { SubmitStoreForReviewUseCase } from './use-cases/submit-store-for-review.use-case';
import { PublishStoreUseCase } from './use-cases/publish-store.use-case';
import { UnpublishStoreUseCase } from './use-cases/unpublish-store.use-case';
import { StoresRepository } from './repositories/stores.repository';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { PrismaService } from '../../database/prisma.service';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

@Controller('seller/store')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
export class StoresController {
  constructor(
    private readonly createStore: CreateStoreUseCase,
    private readonly updateStore: UpdateStoreUseCase,
    private readonly submitForReview: SubmitStoreForReviewUseCase,
    private readonly publishStore: PublishStoreUseCase,
    private readonly unpublishStore: UnpublishStoreUseCase,
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getMyStore(@CurrentUser() user: JwtPayload) {
    const seller = await this.sellersRepo.findByUserId(user.sub);
    if (!seller) throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);

    const s = store as typeof store & { logoMediaId?: string | null; coverMediaId?: string | null };
    const { logoUrl, coverUrl } = await this.resolveStoreImageUrls(s.logoMediaId, s.coverMediaId);
    return { ...store, logoUrl, coverUrl };
  }

  @Post()
  async createMyStore(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStoreDto,
  ) {
    return this.createStore.execute(user.sub, dto);
  }

  @Patch()
  async updateMyStore(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.updateStore.execute(user.sub, dto);
  }

  @Put()
  async replaceMyStore(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.updateStore.execute(user.sub, dto);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitForReviewHandler(@CurrentUser() user: JwtPayload) {
    return this.submitForReview.execute(user.sub);
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  async publishHandler(@CurrentUser() user: JwtPayload) {
    return this.publishStore.execute(user.sub);
  }

  @Post('unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublishHandler(@CurrentUser() user: JwtPayload) {
    return this.unpublishStore.execute(user.sub);
  }

  // ─── Store directions (many-to-many GlobalCategory) ─────────────────────────
  // Polat 06.05: продавец вводит направления → autocomplete → multi-select.
  // Backend хранит в store_directions (junction); frontend читает /storefront/categories
  // для suggestions (level=0 «Отрасли»: Электроника, Одежда, Дом и сад…).

  @Get('directions')
  async getDirections(@CurrentUser() user: JwtPayload) {
    const store = await this.requireMyStore(user.sub);
    const rows = await this.prisma.storeDirection.findMany({
      where: { storeId: store.id },
      include: {
        globalCategory: {
          select: { id: true, slug: true, nameRu: true, nameUz: true, iconEmoji: true, level: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.globalCategory);
  }

  @Put('directions')
  async replaceDirections(
    @CurrentUser() user: JwtPayload,
    @Body() body: ReplaceDirectionsDto,
  ) {
    // class-validator (через ValidationPipe) гарантирует Array<string> размера ≤10.
    // Доп. фильтр на пустые строки + явный slice — defense-in-depth если pipe выключат.
    const ids = body.ids
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      .slice(0, 10);

    const store = await this.requireMyStore(user.sub);

    if (ids.length > 0) {
      // Проверяем что все id реально существуют (защита от чужих/удалённых категорий).
      const existing = await this.prisma.globalCategory.findMany({
        where: { id: { in: ids }, isActive: true },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((c) => c.id));
      const validIds = ids.filter((id) => existingIds.has(id));

      await this.prisma.$transaction([
        this.prisma.storeDirection.deleteMany({ where: { storeId: store.id } }),
        ...(validIds.length > 0
          ? [this.prisma.storeDirection.createMany({
              data: validIds.map((globalCategoryId) => ({ storeId: store.id, globalCategoryId })),
              skipDuplicates: true,
            })]
          : []),
      ]);
    } else {
      await this.prisma.storeDirection.deleteMany({ where: { storeId: store.id } });
    }

    return this.getDirections(user);
  }

  private async requireMyStore(userId: string): Promise<{ id: string }> {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    return { id: store.id };
  }

  private async resolveStoreImageUrls(
    logoMediaId: string | null | undefined,
    coverMediaId: string | null | undefined,
  ): Promise<{ logoUrl: string | null; coverUrl: string | null }> {
    const ids = [logoMediaId, coverMediaId].filter(Boolean) as string[];
    if (!ids.length) return { logoUrl: null, coverUrl: null };

    const files = await this.prisma.mediaFile.findMany({
      where: { id: { in: ids } },
      select: { id: true, bucket: true, objectKey: true },
    });
    const map = new Map(files.map((f) => [f.id, f]));

    const resolve = (id: string | null | undefined): string | null => {
      if (!id) return null;
      const m = map.get(id);
      if (!m?.objectKey) return null;
      const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
      if (m.bucket === 'telegram') {
        return `${appUrl}/api/v1/media/proxy/${m.id}`;
      }
      const r2Base = process.env.STORAGE_PUBLIC_URL ?? '';
      if (r2Base) return `${r2Base}/${m.objectKey}`;
      return m.id && appUrl ? `${appUrl}/api/v1/media/proxy/${m.id}` : null;
    };

    return { logoUrl: resolve(logoMediaId), coverUrl: resolve(coverMediaId) };
  }
}
