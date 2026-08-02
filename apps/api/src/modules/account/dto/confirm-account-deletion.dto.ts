import { IsString, Matches } from 'class-validator';

export class ConfirmAccountDeletionDto {
  // Strictly 6 digits — see OtpService.generateCode (randomInt 100000..999999).
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}
