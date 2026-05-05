import { IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class SendMessageDto {
  // Текст или mediaId должны быть заполнены (но не оба обязательны).
  @ValidateIf((o: SendMessageDto) => !o.mediaId)
  @IsString()
  @MaxLength(2000)
  text?: string;

  @IsOptional()
  @IsUUID()
  parentMessageId?: string;

  @IsOptional()
  @IsUUID()
  mediaId?: string;
}
