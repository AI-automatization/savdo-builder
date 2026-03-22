import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateStoreCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
