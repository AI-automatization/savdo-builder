import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AdminActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
