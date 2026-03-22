import { IsString, IsOptional, IsIn, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateSellerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsIn(['individual', 'business'])
  sellerType?: 'individual' | 'business';

  @IsOptional()
  @IsString()
  @Matches(/^@?[a-zA-Z0-9_]{3,32}$/, { message: 'Invalid Telegram username' })
  telegramUsername?: string;

  @IsOptional()
  @IsIn(['ru', 'uz'])
  languageCode?: 'ru' | 'uz';
}
