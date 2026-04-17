import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BroadcastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message: string;

  @IsOptional()
  @IsBoolean()
  preview_mode?: boolean;
}
