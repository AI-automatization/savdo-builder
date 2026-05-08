import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  country: string = 'UZ';
}

export class ConfirmCheckoutDto {
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  buyerNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  // BUG-WB-AUDIT-009: фронт checkout даёт юзеру редактировать contact-fields
  // (имя/телефон получателя). Раньше они терялись потому что DTO их не
  // принимал → Order.customerFullName/Phone заполнялись из Buyer profile.
  // Теперь optional override: если переданы — используются, иначе fallback.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerFullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;
}
