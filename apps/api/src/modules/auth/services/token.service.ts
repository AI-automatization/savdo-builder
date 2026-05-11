import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') ?? '15m',
    });
  }

  /**
   * TTL access-токена в секундах — для ответов API, которым нужно
   * вернуть `expiresIn` клиенту (admin login, impersonate, mfa/login).
   * Парсит формат `15m`/`1h`/`3600`. Default — 900 (15 минут).
   */
  getAccessTokenTtlSeconds(): number {
    const raw = this.config.get<string>('jwt.accessExpiresIn') ?? '15m';
    const match = /^(\d+)\s*([smhd])?$/.exec(raw.trim());
    if (!match) return 900;
    const n = Number(match[1]);
    if (!Number.isFinite(n)) return 900;
    switch (match[2]) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 3600;
      case 'd': return n * 86400;
      default:  return n; // bare number = seconds
    }
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  async verifyRefreshToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
    } catch {
      return null;
    }
  }
}
