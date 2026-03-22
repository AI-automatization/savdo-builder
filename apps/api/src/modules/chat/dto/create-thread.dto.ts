import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @IsIn(['PRODUCT', 'ORDER'])
  contextType!: string;

  @IsUUID()
  contextId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  firstMessage!: string;
}
