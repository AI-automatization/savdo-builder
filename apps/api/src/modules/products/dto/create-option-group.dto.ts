import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number = 0;
}
