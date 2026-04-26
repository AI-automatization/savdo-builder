import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ProductDisplayType } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNumber()
  @Min(1)
  basePrice: number;

  @IsOptional()
  @IsString()
  currencyCode?: string = 'UZS';

  @IsOptional()
  @IsUUID()
  globalCategoryId?: string;

  @IsOptional()
  @IsUUID()
  storeCategoryId?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean = true;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsEnum(ProductDisplayType)
  displayType?: ProductDisplayType;
}
