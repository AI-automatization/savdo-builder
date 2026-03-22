import { IsString, Matches, IsIn } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @Matches(/^\+998[0-9]{9}$/, { message: 'Phone must be a valid Uzbekistan number (+998XXXXXXXXX)' })
  phone: string;

  @IsIn(['login', 'register', 'checkout'])
  purpose: 'login' | 'register' | 'checkout';
}
