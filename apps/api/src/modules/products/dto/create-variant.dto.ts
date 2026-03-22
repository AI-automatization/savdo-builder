import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsInt,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  priceOverride?: number;

  @IsInt()
  @Min(0)
  stockQuantity: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleOverride?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  optionValueIds?: string[];
}
