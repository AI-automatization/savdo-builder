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
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean, IsInt, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateStoreCategoryDto } from './dto/create-store-category.dto';
import { UpdateStoreCategoryDto } from './dto/update-store-category.dto';
import { GetGlobalCategoriesUseCase } from './use-cases/get-global-categories.use-case';
import { GetStoreCategoriesUseCase } from './use-cases/get-store-categories.use-case';
import { CreateStoreCategoryUseCase } from './use-cases/create-store-category.use-case';
import { UpdateStoreCategoryUseCase } from './use-cases/update-store-category.use-case';
import { DeleteStoreCategoryUseCase } from './use-cases/delete-store-category.use-case';
import { GlobalCategoriesRepository } from './repositories/global-categories.repository';
import { GlobalCategoriesSeedService } from './global-categories-seed.service';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { StoresRepository } from '../stores/repositories/stores.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { PrismaService } from '../../database/prisma.service';

class CreateGlobalCategoryDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nameRu!: string;

  @IsString() @IsNotEmpty() @MaxLength(120)
  nameUz!: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  slug!: string;

  @IsOptional() @IsUUID()
  parentId?: string | null;

  @IsOptional() @IsInt() @Type(() => Number)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

class UpdateGlobalCategoryDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  nameRu?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  nameUz?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  slug?: string;

  @IsOptional() @IsUUID()
  parentId?: string | null;

  @IsOptional() @IsInt() @Type(() => Number)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

@Controller()
export class CategoriesController {
  constructor(
    private readonly getGlobalCategories: GetGlobalCategoriesUseCase,
    private readonly getStoreCategories: GetStoreCategoriesUseCase,
    private readonly createStoreCategory: CreateStoreCategoryUseCase,
    private readonly updateStoreCategory: UpdateStoreCategoryUseCase,
    private readonly deleteStoreCategory: DeleteStoreCategoryUseCase,
    private readonly globalCategoriesRepo: GlobalCategoriesRepository,
    private readonly seedService: GlobalCategoriesSeedService,
    private readonly prisma: PrismaService,
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
  ) {}

  // ─── Public ──────────────────────────────────────────────────────────────────

  @Get('storefront/categories')
  async listGlobalCategories() {
    return this.getGlobalCategories.execute();
  }

  @Get('storefront/categories/:slug/filters')
  async getCategoryFilters(@Param('slug') slug: string) {
    const filters = await this.prisma.categoryFilter.findMany({
      where: { categorySlug: slug },
      orderBy: { sortOrder: 'asc' },
    });
    return filters.map((f) => ({
      key: f.key,
      nameRu: f.nameRu,
      nameUz: f.nameUz,
      fieldType: f.fieldType.toLowerCase(),
      options: f.options ? (() => { try { return JSON.parse(f.options!) as string[]; } catch { return null; } })() : null,
      unit: f.unit,
      sortOrder: f.sortOrder,
    }));
  }

  // ─── Seller ───────────────────────────────────────────────────────────────────

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

  // ─── Admin — GlobalCategory CRUD ─────────────────────────────────────────────

  @Post('admin/categories/seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminSeedCategories() {
    const [cats, filters] = await Promise.all([
      this.seedService.seedCategories(),
      this.seedService.seedFilters(),
    ]);
    return { success: true, categoriesUpserted: cats, filtersUpserted: filters };
  }

  @Get('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminListCategories() {
    return this.globalCategoriesRepo.findAll();
  }

  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminCreateCategory(@Body() dto: CreateGlobalCategoryDto) {
    const existing = await this.globalCategoriesRepo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Категория со slug «${dto.slug}» уже существует`);
    }
    if (dto.parentId) {
      const parent = await this.globalCategoriesRepo.findById(dto.parentId);
      if (!parent) throw new NotFoundException('Родительская категория не найдена');
    }
    return this.globalCategoriesRepo.create(dto);
  }

  @Patch('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminUpdateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateGlobalCategoryDto,
  ) {
    const cat = await this.globalCategoriesRepo.findById(id);
    if (!cat) throw new NotFoundException('Категория не найдена');

    if (dto.slug && dto.slug !== cat.slug) {
      const dup = await this.globalCategoriesRepo.findBySlug(dto.slug);
      if (dup) throw new ConflictException(`Slug «${dto.slug}» уже занят`);
    }
    if (dto.parentId) {
      if (dto.parentId === id) throw new ConflictException('Категория не может быть своим родителем');
      const parent = await this.globalCategoriesRepo.findById(dto.parentId);
      if (!parent) throw new NotFoundException('Родительская категория не найдена');
    }
    return this.globalCategoriesRepo.update(id, dto);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminDeleteCategory(@Param('id') id: string) {
    const cat = await this.globalCategoriesRepo.findById(id);
    if (!cat) throw new NotFoundException('Категория не найдена');
    await this.globalCategoriesRepo.delete(id);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

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
