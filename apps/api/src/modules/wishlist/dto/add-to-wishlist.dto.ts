import { IsString, IsUUID } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  @IsUUID()
  productId!: string;
}
