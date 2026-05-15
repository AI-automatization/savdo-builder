import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

/**
 * API-PRODUCT-IMAGES-PATCH-001: частичное обновление ProductImage —
 * reorder (`sortOrder`) и toggle обложки (`isPrimary`). Оба поля опциональны,
 * но хотя бы одно должно быть передано (проверяется в контроллере).
 */
export class UpdateProductImageDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
