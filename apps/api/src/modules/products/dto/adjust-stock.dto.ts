import { IsInt, IsString, IsNotEmpty, MaxLength, NotEquals } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @NotEquals(0, { message: 'delta must not be 0' })
  delta: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason: string;
}
