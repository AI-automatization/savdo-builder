import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CompSubscriptionDto {
  @IsEnum(['FREE', 'PRO', 'STUDIO'] as const)
  tier!: SubscriptionTier;

  @IsInt()
  @Min(1)
  @Max(36)
  months!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
