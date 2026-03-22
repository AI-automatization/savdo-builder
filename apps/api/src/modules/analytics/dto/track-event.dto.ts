import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsObject,
  IsUUID,
} from 'class-validator';

export class TrackEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventName: string;

  @IsOptional()
  @IsObject()
  eventPayload?: object;

  @IsOptional()
  @IsUUID()
  sessionKey?: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;
}
