import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

// PARTNER-API-RAOS-001: payload от внешнего партнёра (RAOS).
// Бизнес-требование Азима: «faqat rasmi bor mahsulot chiqadi» —
// imageUrls обязателен, минимум 1 фото. Без фото товар не принимается.
export class PartnerCreateProductDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsNumber()
  @IsPositive()
  basePrice!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  imageUrls!: string[];

  // false → создать как DRAFT (не публиковать сразу). По умолчанию публикуем.
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
