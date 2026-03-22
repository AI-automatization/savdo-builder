import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}
