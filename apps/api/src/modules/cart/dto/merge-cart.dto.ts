import { IsUUID } from 'class-validator';

export class MergeCartDto {
  @IsUUID()
  sessionKey: string;
}
