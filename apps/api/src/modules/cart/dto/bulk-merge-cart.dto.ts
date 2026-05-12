import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkMergeCartItemDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

/**
 * TMA-CART-API-SYNC-001: bulk-import нескольких items от authenticated buyer'а
 * в backend cart за один запрос. Используется при первом login из TMA, где
 * cart хранится в localStorage — после auth локальный cart нужно
 * синхронизировать с серверной cart, чтобы открытие web-buyer показывало
 * те же товары.
 *
 * Behavior:
 *   - INV-C01: все items должны быть из одного store. Mismatch → ошибка.
 *   - Если у buyer есть существующая cart с другим store — она очищается
 *     перед import'ом (TMA cart wins — это «свежее намерение» юзера).
 *   - Если product/variant невалиден (deleted/inactive) — item skipped silently.
 *   - Дубликаты по productId+variantId → суммируется quantity (max 100).
 */
export class BulkMergeCartDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'items must not be empty' })
  @ArrayMaxSize(50, { message: 'Cannot bulk-merge more than 50 items at once' })
  @ValidateNested({ each: true })
  @Type(() => BulkMergeCartItemDto)
  items!: BulkMergeCartItemDto[];
}
