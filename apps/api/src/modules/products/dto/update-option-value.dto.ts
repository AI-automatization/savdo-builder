import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOptionValueDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
