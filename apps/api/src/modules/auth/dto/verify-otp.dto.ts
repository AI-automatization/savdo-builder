import { IsString, Matches, Length, IsIn } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+998[0-9]{9}$/)
  phone: string;

  @IsString()
  @Length(4, 6)
  code: string;

  @IsIn(['login', 'register', 'checkout'])
  purpose: 'login' | 'register' | 'checkout';
}
