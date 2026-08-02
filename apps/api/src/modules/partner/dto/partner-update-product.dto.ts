import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

// INTEG-RAOS-002 (issue #5): PATCH-payload от партнёра — все поля опциональны,
// партнёр шлёт только то, что реально изменилось. Имена полей и форма Partial
// повторяют RAOS-сторону (SavdoOutboundService.updateProduct).
export class PartnerUpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl?: string;

  // true → опубликовать (DRAFT/ARCHIVED → ACTIVE), false → снять с витрины (→ ARCHIVED).
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
