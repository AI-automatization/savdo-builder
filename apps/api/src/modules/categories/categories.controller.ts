import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateStoreCategoryDto } from './dto/create-store-category.dto';
import { UpdateStoreCategoryDto } from './dto/update-store-category.dto';
import { GetGlobalCategoriesUseCase } from './use-cases/get-global-categories.use-case';
import { GetStoreCategoriesUseCase } from './use-cases/get-store-categories.use-case';
import { CreateStoreCategoryUseCase } from './use-cases/create-store-category.use-case';
import { UpdateStoreCategoryUseCase } from './use-cases/update-store-category.use-case';
import { DeleteStoreCategoryUseCase } from './use-cases/delete-store-category.use-case';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { StoresRepository } from '../stores/repositories/stores.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

@Controller()
export class CategoriesController {
  constructor(
    private readonly getGlobalCategories: GetGlobalCategoriesUseCase,
    private readonly getStoreCategories: GetStoreCategoriesUseCase,
    private readonly createStoreCategory: CreateStoreCategoryUseCase,
    private readonly updateStoreCategory: UpdateStoreCategoryUseCase,
    private readonly deleteStoreCategory: DeleteStoreCategoryUseCase,
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
  ) {}

  @Get('storefront/categories')
  async listGlobalCategories() {
    return this.getGlobalCategories.execute();
  }

  @Get('seller/categories')
  @UseGuards(JwtAuthGuard)
  async listMyStoreCategories(@CurrentUser() user: JwtPayload) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.getStoreCategories.execute(storeId);
  }

  @Post('seller/categories')
  @UseGuards(JwtAuthGuard)
  async createCategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStoreCategoryDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.createStoreCategory.execute(storeId, dto);
  }

  @Patch('seller/categories/:id')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStoreCategoryDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.updateStoreCategory.execute(id, storeId, dto);
  }

  @Delete('seller/categories/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.deleteStoreCategory.execute(id, storeId);
  }

  private async resolveStoreId(userId: string): Promise<string> {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    return store.id;
  }
}
