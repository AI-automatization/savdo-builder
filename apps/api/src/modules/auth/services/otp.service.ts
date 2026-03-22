import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private eskizToken: string | null = null;

  constructor(private readonly config: ConfigService) {}

  generateCode(): string {
    // 4-digit code
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  async verifyCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const devMode = this.config.get<boolean>('features.devOtpEnabled');

    if (devMode) {
      this.logger.warn(`[DEV OTP] Phone: ${phone} | Code: ${code}`);
      return;
    }

    await this.sendViaEskiz(phone, code);
  }

  private async sendViaEskiz(phone: string, code: string): Promise<void> {
    const message = `Savdo: your verification code is ${code}. Valid for 5 minutes.`;

    try {
      if (!this.eskizToken) {
        await this.refreshEskizToken();
      }

      await axios.post(
        'https://notify.eskiz.uz/api/message/sms/send',
        {
          mobile_phone: phone.replace('+', ''),
          message,
          from: this.config.get('ESKIZ_FROM') ?? '4546',
        },
        { headers: { Authorization: `Bearer ${this.eskizToken}` } },
      );
    } catch (error) {
      this.logger.error(`Failed to send OTP via Eskiz to ${phone}`, error);
      throw error;
    }
  }

  private async refreshEskizToken(): Promise<void> {
    const response = await axios.post('https://notify.eskiz.uz/api/auth/login', {
      email: this.config.get('ESKIZ_EMAIL'),
      password: this.config.get('ESKIZ_PASSWORD'),
    });
    this.eskizToken = response.data?.data?.token;
  }
}
