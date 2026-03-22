import { IsEnum } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class ChangeProductStatusDto {
  @IsEnum(ProductStatus)
  status: ProductStatus;
}
