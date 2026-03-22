import { IsOptional, IsBoolean } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional()
  @IsBoolean()
  mobilePushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  webPushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  telegramEnabled?: boolean;
}
