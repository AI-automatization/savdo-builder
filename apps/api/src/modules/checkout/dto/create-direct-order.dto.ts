import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DirectOrderItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  // QA-AUDIT-001: верхняя граница защищает от accidental 99999 (было @Min(1) only).
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}

export class CreateDirectOrderDto {
  // API-DIRECT-ORDER-DOS-001: ArrayMaxSize защищает от N+1-DoS через большой items[].
  // 50 — реалистичный потолок для одного заказа в B2C маркетплейсе.
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must contain at least one item' })
  @ArrayMaxSize(50, { message: 'Order cannot exceed 50 items' })
  @ValidateNested({ each: true })
  @Type(() => DirectOrderItemDto)
  items: DirectOrderItemDto[];

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  buyerName: string;

  @Matches(/^\+998\d{9}$/, { message: 'Phone must be in format +998XXXXXXXXX' })
  buyerPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  buyerNote?: string;
}
