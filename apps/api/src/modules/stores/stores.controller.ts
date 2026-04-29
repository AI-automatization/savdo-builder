import { Controller, Get, Post, Patch, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
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
      if (m.bucket === 'telegram') {
        return `${(process.env.APP_URL ?? '').replace(/\/$/, '')}/api/v1/media/proxy/${m.id}`;
      }
      const r2Base = process.env.STORAGE_PUBLIC_URL ?? '';
      return r2Base ? `${r2Base}/${m.objectKey}` : null;
    };

    return { logoUrl: resolve(logoMediaId), coverUrl: resolve(coverMediaId) };
  }
}
