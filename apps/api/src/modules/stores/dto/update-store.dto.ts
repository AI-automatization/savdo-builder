import { IsString, MinLength, MaxLength, IsOptional, IsBoolean, IsUUID, IsIn, IsNumber, Min } from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  telegramContactLink?: string;

  @IsOptional()
  @IsUUID()
  logoMediaId?: string;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;

  @IsOptional()
  @IsUUID()
  primaryGlobalCategoryId?: string;

  @IsOptional()
  @IsIn(['fixed', 'manual', 'none'])
  deliveryFeeType?: 'fixed' | 'manual' | 'none';

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFeeAmount?: number;
}
