import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export type BroadcastAudience = 'all' | 'sellers' | 'buyers';

export class BroadcastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message: string;

  @IsOptional()
  @IsBoolean()
  preview_mode?: boolean;

  @IsOptional()
  @IsIn(['all', 'sellers', 'buyers'])
  audience?: BroadcastAudience;
}
