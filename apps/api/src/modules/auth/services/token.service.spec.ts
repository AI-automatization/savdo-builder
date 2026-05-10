/**
 * Тесты для `TokenService`.
 *
 * Auth/JWT primitives — security-critical. Покрытие:
 *   - generateAccessToken: payload + secret + expiresIn from config
 *   - getAccessTokenTtlSeconds: парсит 15m/1h/3600s, fallback 900
 *   - generateRefreshToken: crypto.randomBytes(40) → 80 hex chars
 *   - hash/verify refresh token (bcrypt)
 *   - verifyAccessToken: возвращает payload | null (на ошибке — null)
 */
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
      verify: jest.fn(),
    };
    config = { get: jest.fn() };
    service = new TokenService(
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe('generateAccessToken', () => {
    it('подписывает payload секретом из config + expiresIn', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'jwt.accessSecret') return 'super-secret';
        if (key === 'jwt.accessExpiresIn') return '30m';
        return undefined;
      });
      const result = service.generateAccessToken({ sub: 'u-1', role: 'BUYER', sessionId: 's-1' });
      expect(result).toBe('signed.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'u-1', role: 'BUYER', sessionId: 's-1' },
        { secret: 'super-secret', expiresIn: '30m' },
      );
    });

    it('expiresIn fallback на 15m если config не задан', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'jwt.accessSecret') return 'secret';
        return undefined;
      });
      service.generateAccessToken({ sub: 'u-1', role: 'BUYER', sessionId: 's-1' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        { secret: 'secret', expiresIn: '15m' },
      );
    });
  });

  describe('getAccessTokenTtlSeconds', () => {
    it('15m → 900', () => {
      config.get.mockReturnValue('15m');
      expect(service.getAccessTokenTtlSeconds()).toBe(900);
    });

    it('1h → 3600', () => {
      config.get.mockReturnValue('1h');
      expect(service.getAccessTokenTtlSeconds()).toBe(3600);
    });

    it('60s → 60', () => {
      config.get.mockReturnValue('60s');
      expect(service.getAccessTokenTtlSeconds()).toBe(60);
    });

    it('1d → 86400', () => {
      config.get.mockReturnValue('1d');
      expect(service.getAccessTokenTtlSeconds()).toBe(86400);
    });

    it('"3600" без unit → 3600 (bare number = seconds)', () => {
      config.get.mockReturnValue('3600');
      expect(service.getAccessTokenTtlSeconds()).toBe(3600);
    });

    it('пустой / undefined → fallback на 15m → 900', () => {
      config.get.mockReturnValue(undefined);
      expect(service.getAccessTokenTtlSeconds()).toBe(900);
    });

    it('невалидный формат → 900', () => {
      config.get.mockReturnValue('abc');
      expect(service.getAccessTokenTtlSeconds()).toBe(900);
    });

    it('whitespace игнорируется', () => {
      config.get.mockReturnValue('  30m  ');
      expect(service.getAccessTokenTtlSeconds()).toBe(1800);
    });
  });

  describe('generateRefreshToken', () => {
    it('возвращает 80-char hex string (40 bytes * 2)', () => {
      const token = service.generateRefreshToken();
      expect(token).toMatch(/^[0-9a-f]{80}$/);
    });

    it('каждый вызов даёт уникальный токен', () => {
      const a = service.generateRefreshToken();
      const b = service.generateRefreshToken();
      expect(a).not.toBe(b);
    });
  });

  describe('hashRefreshToken / verifyRefreshToken (bcrypt)', () => {
    it('hash + verify same → true', async () => {
      const token = 'plaintext-token-xyz';
      const hash = await service.hashRefreshToken(token);
      expect(hash).not.toBe(token);
      expect(hash.length).toBeGreaterThan(50);
      expect(await service.verifyRefreshToken(token, hash)).toBe(true);
    });

    it('hash + verify wrong token → false', async () => {
      const hash = await service.hashRefreshToken('correct');
      expect(await service.verifyRefreshToken('wrong', hash)).toBe(false);
    });

    it('два hash одного и того же токена дают разный output (salt)', async () => {
      const token = 'same';
      const a = await service.hashRefreshToken(token);
      const b = await service.hashRefreshToken(token);
      expect(a).not.toBe(b);
      // оба валидируются
      expect(await service.verifyRefreshToken(token, a)).toBe(true);
      expect(await service.verifyRefreshToken(token, b)).toBe(true);
    });
  });

  describe('verifyAccessToken', () => {
    it('валидный токен → payload', () => {
      jwtService.verify.mockReturnValue({ sub: 'u-1', role: 'BUYER', sessionId: 's-1' });
      config.get.mockReturnValue('secret');
      const result = service.verifyAccessToken('token');
      expect(result).toEqual({ sub: 'u-1', role: 'BUYER', sessionId: 's-1' });
      expect(jwtService.verify).toHaveBeenCalledWith('token', { secret: 'secret' });
    });

    it('expired/invalid → null (catch swallows error)', () => {
      jwtService.verify.mockImplementation(() => { throw new Error('jwt expired'); });
      config.get.mockReturnValue('secret');
      expect(service.verifyAccessToken('expired')).toBeNull();
    });
  });
});
