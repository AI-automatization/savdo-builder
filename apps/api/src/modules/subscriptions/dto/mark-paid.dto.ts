import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SubscriptionTier, SubscriptionPaymentMethod } from '@prisma/client';

export class MarkPaidDto {
  @IsEnum(['FREE', 'PRO', 'STUDIO'] as const)
  tier!: SubscriptionTier;

  @IsInt()
  @Min(1)
  amountUzs!: number;

  @IsISO8601()
  periodStart!: string;

  @IsISO8601()
  periodEnd!: string;

  @IsOptional()
  @IsEnum(['MANUAL_TRANSFER', 'CLICK', 'PAYME', 'COMP'] as const)
  method?: SubscriptionPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
