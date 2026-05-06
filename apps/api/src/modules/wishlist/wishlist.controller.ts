import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { UsersRepository } from '../users/repositories/users.repository';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { GetWishlistUseCase } from './use-cases/get-wishlist.use-case';
import { AddToWishlistUseCase } from './use-cases/add-to-wishlist.use-case';
import { RemoveFromWishlistUseCase } from './use-cases/remove-from-wishlist.use-case';

@Controller('buyer/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly getWishlistUseCase: GetWishlistUseCase,
    private readonly addToWishlistUseCase: AddToWishlistUseCase,
    private readonly removeFromWishlistUseCase: RemoveFromWishlistUseCase,
  ) {}

  @Get()
  async getWishlist(@CurrentUser() user: JwtPayload) {
    const buyerId = await this.resolveBuyerId(user.sub);
    return this.getWishlistUseCase.execute(buyerId, (m) => this.resolveImageUrl(m));
  }

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddToWishlistDto,
  ) {
    const buyerId = await this.resolveBuyerId(user.sub);
    const item = await this.addToWishlistUseCase.execute(buyerId, dto.productId);
    return {
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt.toISOString(),
    };
  }

  @Delete(':productId')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
  ): Promise<void> {
    const buyerId = await this.resolveBuyerId(user.sub);
    await this.removeFromWishlistUseCase.execute(buyerId, productId);
  }

  private async resolveBuyerId(userId: string): Promise<string> {
    const user = await this.usersRepo.findById(userId);
    if (!user || !user.buyer) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user.buyer.id;
  }

  private resolveImageUrl(media: unknown): string {
    const m = media as { id?: string; objectKey?: string; bucket?: string } | null | undefined;
    if (!m?.objectKey) return '';
    const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
    if (m.bucket === 'telegram') {
      return `${appUrl}/api/v1/media/proxy/${m.id}`;
    }
    const r2Base = process.env.STORAGE_PUBLIC_URL ?? '';
    if (r2Base) return `${r2Base}/${m.objectKey}`;
    return m.id && appUrl ? `${appUrl}/api/v1/media/proxy/${m.id}` : '';
  }
}
