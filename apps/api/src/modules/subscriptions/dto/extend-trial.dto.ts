import { IsInt, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator';

export class ExtendTrialDto {
  @IsInt()
  @Min(1)
  @Max(365)
  days!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
