import { IsBoolean, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

// SELLER-PAYMENT-REQUISITES-001: владелец магазина вводит реквизиты один раз.
// Все поля опциональны (PATCH-семантика); null = очистить поле.
export class UpdatePaymentRequisitesDto {
  /** Номер карты «8600 1234 5678 9012» — цифры и пробелы, 13–24 символа цифр. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^(\d[\d ]{11,28}\d)?$/, {
    message: 'cardNumber must contain only digits and spaces (13-24 digits)',
  })
  cardNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cardHolder?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(300)
  clickLink?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(300)
  paymeLink?: string | null;

  @IsOptional()
  @IsBoolean()
  acceptsCash?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsCardTransfer?: boolean;
}
