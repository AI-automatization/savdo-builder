import { IsOptional, IsString, MaxLength, IsUrl, Matches, ValidateIf } from 'class-validator';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001: настройки публикации в TG-канал продавца.
 *
 * Все поля optional. Пустая строка `""` трактуется как «очистить»
 * (применяется в use-case как `null`). Не переданное поле — не трогаем.
 *
 * Template limit 4000 символов (с запасом — TG caption 1024, но шаблон
 * содержит секции `{{#…}}` которые могут уходить в пусто).
 */
export class UpdateChannelTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  channelPostTemplate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ValidateIf((_, v) => v !== '')
  @Matches(/^[+\d\s()-]+$/, { message: 'Phone must contain only digits, spaces, +, -, ()' })
  channelContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ValidateIf((_, v) => v !== '')
  @IsUrl({ require_protocol: true })
  channelInstagramLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ValidateIf((_, v) => v !== '')
  @IsUrl({ require_protocol: true })
  channelTiktokLink?: string;
}
