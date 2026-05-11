/**
 * Тесты для `RequestOtpUseCase`.
 *
 * Rate-limit (3 запроса / 10 мин на phone+purpose) — anti-spam защита.
 * Покрытие:
 *   - rate-limit срабатывает на 3-й попытке
 *   - happy path: создаёт OtpRequest + sendOtp
 *   - expiresAt = now + 5 минут
 */
import { ConfigService } from '@nestjs/config';
import { RequestOtpUseCase } from './request-otp.use-case';
import { AuthRepository } from '../repositories/auth.repository';
import { OtpService } from '../services/otp.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

describe('RequestOtpUseCase', () => {
  let useCase: RequestOtpUseCase;
  let authRepo: { countRecentOtpRequests: jest.Mock; createOtpRequest: jest.Mock };
  let otpService: { generateCode: jest.Mock; hashCode: jest.Mock; sendOtp: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    authRepo = {
      countRecentOtpRequests: jest.fn().mockResolvedValue(0),
      createOtpRequest: jest.fn().mockResolvedValue({ id: 'otp-1' }),
    };
    otpService = {
      generateCode: jest.fn().mockReturnValue('123456'),
      hashCode: jest.fn().mockResolvedValue('hashed-code'),
      sendOtp: jest.fn().mockResolvedValue(undefined),
    };
    config = { get: jest.fn() };
    useCase = new RequestOtpUseCase(
      authRepo as unknown as AuthRepository,
      otpService as unknown as OtpService,
      config as unknown as ConfigService,
    );
  });

  it('rate-limit: 3 запросов за окно → OTP_SEND_LIMIT', async () => {
    authRepo.countRecentOtpRequests.mockResolvedValue(3);
    await expect(useCase.execute('+998900000001', 'login'))
      .rejects.toThrow(DomainException);
    expect(otpService.sendOtp).not.toHaveBeenCalled();
    expect(authRepo.createOtpRequest).not.toHaveBeenCalled();
  });

  it('rate-limit: 0 запросов → ok', async () => {
    authRepo.countRecentOtpRequests.mockResolvedValue(0);
    await expect(useCase.execute('+998900000001', 'login')).resolves.toBeDefined();
  });

  it('rate-limit: 2 запроса (граница) → ok', async () => {
    authRepo.countRecentOtpRequests.mockResolvedValue(2);
    await expect(useCase.execute('+998900000001', 'login')).resolves.toBeDefined();
  });

  it('rate-limit: > 3 → блокирует', async () => {
    authRepo.countRecentOtpRequests.mockResolvedValue(99);
    try {
      await useCase.execute('+998900000001', 'login');
      fail('should have thrown');
    } catch (err) {
      expect((err as DomainException).code).toBe(ErrorCode.OTP_SEND_LIMIT);
    }
  });

  it('countRecentOtpRequests вызывается с phone + windowStart + purpose', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    await useCase.execute('+998900000001', 'login');
    expect(authRepo.countRecentOtpRequests).toHaveBeenCalledWith(
      '+998900000001',
      new Date(now - 10 * 60 * 1000),
      'login',
    );
    (Date.now as jest.Mock).mockRestore();
  });

  it('happy path: generateCode → hashCode → createOtpRequest → sendOtp', async () => {
    const result = await useCase.execute('+998900000001', 'login');
    expect(otpService.generateCode).toHaveBeenCalled();
    expect(otpService.hashCode).toHaveBeenCalledWith('123456');
    expect(authRepo.createOtpRequest).toHaveBeenCalledWith(expect.objectContaining({
      phone: '+998900000001',
      codeHash: 'hashed-code',
      purpose: 'login',
      expiresAt: expect.any(Date),
    }));
    expect(otpService.sendOtp).toHaveBeenCalledWith('+998900000001', '123456');
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('expiresAt = now + 5 минут', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const result = await useCase.execute('+998900000001', 'login');
    expect(result.expiresAt.getTime()).toBe(now + 5 * 60 * 1000);
    (Date.now as jest.Mock).mockRestore();
  });

  it('sendOtp throws → ошибка пробрасывается (createOtpRequest УЖЕ записал — best-effort)', async () => {
    otpService.sendOtp.mockRejectedValue(new Error('TG down'));
    await expect(useCase.execute('+998900000001', 'login')).rejects.toThrow(/TG down/);
    // запись о попытке всё равно создана (для rate-limit учёта)
    expect(authRepo.createOtpRequest).toHaveBeenCalled();
  });

  it('purpose разделяет окна: login vs reset_password (разные ключи)', async () => {
    await useCase.execute('+998900000001', 'login');
    await useCase.execute('+998900000001', 'reset_password');
    expect(authRepo.countRecentOtpRequests).toHaveBeenNthCalledWith(
      1, '+998900000001', expect.any(Date), 'login',
    );
    expect(authRepo.countRecentOtpRequests).toHaveBeenNthCalledWith(
      2, '+998900000001', expect.any(Date), 'reset_password',
    );
  });
});
