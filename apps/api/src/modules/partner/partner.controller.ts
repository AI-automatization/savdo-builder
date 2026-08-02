import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PartnerApiKeyGuard, PartnerRequest } from './guards/partner-api-key.guard';
import { PartnerCreateProductDto } from './dto/partner-create-product.dto';
import { PartnerUpdateProductDto } from './dto/partner-update-product.dto';
import { PartnerUpdateStockDto } from './dto/partner-update-stock.dto';
import { PartnerCreateProductUseCase } from './use-cases/partner-create-product.use-case';
import { PartnerUpdateProductUseCase } from './use-cases/partner-update-product.use-case';
import { PartnerUpdateStockUseCase } from './use-cases/partner-update-stock.use-case';
import { PartnerDeleteProductUseCase } from './use-cases/partner-delete-product.use-case';

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
  constructor(
    private readonly createProduct: PartnerCreateProductUseCase,
    private readonly updateProduct: PartnerUpdateProductUseCase,
    private readonly updateStock: PartnerUpdateStockUseCase,
    private readonly deleteProduct: PartnerDeleteProductUseCase,
  ) {}

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

  // INTEG-RAOS-002 (issue #5): PATCH /api/v1/partner/products/:id
  @Patch('products/:id')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async update(
    @Req() req: PartnerRequest,
    @Param('id') id: string,
    @Body() dto: PartnerUpdateProductDto,
  ) {
    const ctx = req.partnerContext!;
    const product = await this.updateProduct.execute(ctx, id, dto);

    return {
      id: product.id,
      title: product.title,
      status: product.status,
      basePrice: product.basePrice,
    };
  }

  // INTEG-RAOS-002 (issue #5): PATCH /api/v1/partner/products/:id/stock
  @Patch('products/:id/stock')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async updateProductStock(
    @Req() req: PartnerRequest,
    @Param('id') id: string,
    @Body() dto: PartnerUpdateStockDto,
  ) {
    const ctx = req.partnerContext!;
    const product = await this.updateStock.execute(ctx, id, dto.stock);

    return { id: product.id, totalStock: product.totalStock };
  }

  // INTEG-RAOS-002 (issue #5): DELETE /api/v1/partner/products/:id
  // 200 + JSON body (не 204) — RAOS-сторона (savdo-outbound.service.ts) всегда
  // делает `await response.json()`, пустой 204-body сломал бы её парсинг.
  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async remove(@Req() req: PartnerRequest, @Param('id') id: string) {
    const ctx = req.partnerContext!;
    await this.deleteProduct.execute(ctx, id);

    return { id, deleted: true };
  }
}
