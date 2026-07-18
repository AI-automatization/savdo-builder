import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PartnerApiKeyGuard, PartnerRequest } from './guards/partner-api-key.guard';
import { PartnerCreateProductDto } from './dto/partner-create-product.dto';
import { PartnerCreateProductUseCase } from './use-cases/partner-create-product.use-case';

const BUYER_BASE_URL = () =>
  (process.env.BUYER_URL ?? 'https://shop.maxsavdo.uz').replace(/\/+$/, '');

/**
 * PARTNER-API-RAOS-001: внешний партнёрский API.
 * Auth: X-Api-Key (см. PartnerApiKeyGuard); @Public отключает глобальный JWT.
 */
@ApiTags('partner')
@ApiSecurity('api-key')
@Controller('partner')
@Public()
@UseGuards(PartnerApiKeyGuard)
export class PartnerController {
  constructor(private readonly createProduct: PartnerCreateProductUseCase) {}

  // POST /api/v1/partner/products
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 30 } }) // как у seller create
  async create(@Req() req: PartnerRequest, @Body() dto: PartnerCreateProductDto) {
    // Guard гарантирует partnerContext — non-null assertion безопасен.
    const ctx = req.partnerContext!;
    const { product, imageCount } = await this.createProduct.execute(ctx, dto);

    return {
      id: product.id,
      title: product.title,
      status: product.status,
      storeId: ctx.storeId,
      imageCount,
      publicUrl: `${BUYER_BASE_URL()}/${ctx.storeSlug}/products/${product.id}`,
    };
  }
}
