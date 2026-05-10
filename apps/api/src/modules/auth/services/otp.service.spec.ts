/**
 * Тесты для `OtpService`.
 *
 * Brute-force protection (SEC-002) + Telegram-only delivery — критично.
 * Покрытие:
 *   - generateCode: 6 digits в диапазоне [100000, 999999]
 *   - hashCode/verifyCode (bcrypt round-trip)
 *   - checkVerifyAttempts: блокирует после OTP_MAX_ATTEMPTS=5, Redis fail → не блокирует
 *   - recordFailedAttempt: increment с TTL 15min, fail-tolerant
 *   - clearVerifyAttempts: del key, fail-tolerant
 *   - sendOtp: dev-mode skip TG check, prod-mode требует chatId, throws TELEGRAM_NOT_LINKED
 */
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { OtpService } from './otp.service';
import { RedisService } from '../../../shared/redis.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

describe('OtpService', () => {
  let service: OtpService;
  let config: { get: jest.Mock };
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let queue: { add: jest.Mock };

  beforeEach(() => {
    config = { get: jest.fn() };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    queue = { add: jest.fn().mockResolvedValue(undefined) };
    service = new OtpService(
      config as unknown as ConfigService,
      redis as unknown as RedisService,
      queue as unknown as Queue,
    );
  });

  describe('generateCode', () => {
    it('возвращает 6-значный numeric string', () => {
      for (let i = 0; i < 50; i++) {
        const code = service.generateCode();
        expect(code).toMatch(/^\d{6}$/);
        const num = Number(code);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it('два кода подряд НЕ обязаны быть равны (cryptographically random)', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) codes.add(service.generateCode());
      // Минимум >1 уникальный — проверяем что генератор работает (не константа)
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('hashCode / verifyCode (bcrypt)', () => {
    it('hash + verify правильного кода → true', async () => {
      const code = '123456';
      const hash = await service.hashCode(code);
      expect(hash).not.toBe(code);
      expect(await service.verifyCode(code, hash)).toBe(true);
    });

    it('verify неверного кода → false', async () => {
      const hash = await service.hashCode('123456');
      expect(await service.verifyCode('999999', hash)).toBe(false);
    });
  });

  describe('checkVerifyAttempts (SEC-002 brute-force)', () => {
    it('attempts = null → ok (нет попыток)', async () => {
      redis.get.mockResolvedValue(null);
      await expect(service.checkVerifyAttempts('+998900000001')).resolves.toBeUndefined();
    });

    it('attempts < 5 → ok', async () => {
      redis.get.mockResolvedValue('3');
      await expect(service.checkVerifyAttempts('+998900000001')).resolves.toBeUndefined();
    });

    it('attempts = 5 → DomainException OTP_SEND_LIMIT', async () => {
      redis.get.mockResolvedValue('5');
      await expect(service.checkVerifyAttempts('+998900000001'))
        .rejects.toThrow(DomainException);
      try {
        await service.checkVerifyAttempts('+998900000001');
      } catch (err) {
        expect((err as DomainException).code).toBe(ErrorCode.OTP_SEND_LIMIT);
      }
    });

    it('attempts > 5 → также блокирует', async () => {
      redis.get.mockResolvedValue('99');
      await expect(service.checkVerifyAttempts('+998900000001'))
        .rejects.toThrow(/Слишком много/);
    });

    it('Redis throws → НЕ блокирует (graceful degradation)', async () => {
      redis.get.mockRejectedValue(new Error('Redis down'));
      await expect(service.checkVerifyAttempts('+998900000001')).resolves.toBeUndefined();
    });

    it('DomainException пробрасывается даже если бросает после Redis call', async () => {
      // Если внутри try DomainException, она должна пройти наружу
      redis.get.mockResolvedValue('5');
      let caught: unknown;
      try {
        await service.checkVerifyAttempts('+998900000001');
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(DomainException);
    });

    it('ключ формируется правильно: otp:attempts:<phone>', async () => {
      await service.checkVerifyAttempts('+998900000001');
      expect(redis.get).toHaveBeenCalledWith('otp:attempts:+998900000001');
    });
  });

  describe('recordFailedAttempt', () => {
    it('первый fail → set "1" с TTL 15min (900s)', async () => {
      redis.get.mockResolvedValue(null);
      await service.recordFailedAttempt('+998900000001');
      expect(redis.set).toHaveBeenCalledWith('otp:attempts:+998900000001', '1', 15 * 60);
    });

    it('повторный fail → increment', async () => {
      redis.get.mockResolvedValue('2');
      await service.recordFailedAttempt('+998900000001');
      expect(redis.set).toHaveBeenCalledWith('otp:attempts:+998900000001', '3', 15 * 60);
    });

    it('Redis throws → не падает, лог + return', async () => {
      redis.get.mockRejectedValue(new Error('redis dead'));
      await expect(service.recordFailedAttempt('+998900000001')).resolves.toBeUndefined();
    });

    it('Redis.set throws → не падает', async () => {
      redis.get.mockResolvedValue('1');
      redis.set.mockRejectedValue(new Error('write fail'));
      await expect(service.recordFailedAttempt('+998900000001')).resolves.toBeUndefined();
    });
  });

  describe('clearVerifyAttempts', () => {
    it('del по ключу', async () => {
      await service.clearVerifyAttempts('+998900000001');
      expect(redis.del).toHaveBeenCalledWith('otp:attempts:+998900000001');
    });

    it('Redis throws → fail-safe', async () => {
      redis.del.mockRejectedValue(new Error('boom'));
      await expect(service.clearVerifyAttempts('+998900000001')).resolves.toBeUndefined();
    });
  });

  describe('sendOtp — dev mode', () => {
    it('devOtpEnabled=true + chatId есть → enqueue без ошибок', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'features.devOtpEnabled') return true;
        return undefined;
      });
      redis.get.mockResolvedValue('111111'); // chatId привязан
      await service.sendOtp('+998900000001', '123456');
      expect(queue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ chatId: '111111', phone: '+998900000001', code: '123456' }),
        expect.objectContaining({ priority: 1 }),
      );
    });

    it('devOtpEnabled=true + chatId НЕТ → не падает (silent skip)', async () => {
      config.get.mockReturnValue(true);
      redis.get.mockResolvedValue(null);
      await expect(service.sendOtp('+998900000001', '123456')).resolves.toBeUndefined();
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('sendOtp — prod mode', () => {
    beforeEach(() => {
      config.get.mockImplementation((key: string) => {
        if (key === 'features.devOtpEnabled') return false;
        if (key === 'telegram.botUsername') return 'test_bot';
        return undefined;
      });
    });

    it('chatId привязан → enqueue', async () => {
      redis.get.mockResolvedValue('999999');
      await service.sendOtp('+998900000001', '123456');
      expect(queue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ chatId: '999999', phone: '+998900000001', code: '123456' }),
        expect.objectContaining({ priority: 1 }),
      );
    });

    it('chatId НЕТ → DomainException TELEGRAM_NOT_LINKED', async () => {
      redis.get.mockResolvedValue(null);
      await expect(service.sendOtp('+998900000001', '123456'))
        .rejects.toThrow(/Telegram не привязан/);
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('сообщение содержит botUsername из config', async () => {
      redis.get.mockResolvedValue(null);
      try {
        await service.sendOtp('+998900000001', '123456');
        fail('should have thrown');
      } catch (err) {
        expect((err as Error).message).toContain('@test_bot');
      }
    });

    it('fallback botUsername=savdo_builderBOT если config пустой', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'features.devOtpEnabled') return false;
        return undefined;
      });
      redis.get.mockResolvedValue(null);
      try {
        await service.sendOtp('+998900000001', '123456');
        fail('should have thrown');
      } catch (err) {
        expect((err as Error).message).toContain('@savdo_builderBOT');
      }
    });
  });
});
