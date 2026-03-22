import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsInt,
  IsBoolean,
} from 'class-validator';

// optionValueIds intentionally excluded — variant options are immutable after creation
export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  priceOverride?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleOverride?: string;
}
