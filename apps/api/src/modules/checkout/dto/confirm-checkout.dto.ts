import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const PAYMENT_METHODS = ['cash', 'card', 'online'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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

  // API-CHECKOUT-PAYMENT-METHOD-001 (от Азима, web-sync audit 14.05.2026):
  // способ оплаты. Раньше DTO его не принимал → web-buyer card-кнопка
  // была misleading (заказ всё равно создавался как cash). Теперь
  // явный enum. Default 'cash' если не передан (backward-compat).
  // 'online' принимается use-case'ом только при PAYMENT_ONLINE_ENABLED.
  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: PaymentMethod;
}
