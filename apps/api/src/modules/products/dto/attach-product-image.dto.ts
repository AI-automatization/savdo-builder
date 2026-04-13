import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class AttachProductImageDto {
  @IsString()
  mediaId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
