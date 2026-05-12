/**
 * Тесты для `VerifyOtpUseCase`.
 *
 * Auth flow — security-critical. Покрываем все ветки:
 *   - brute-force защита (SEC-002): проверка attempts ДО db lookup
 *   - OTP not found / invalid → record failed attempt
 *   - existing user без buyer → ensureBuyerProfile
 *   - new user → createUserWithBuyer
 *   - SELLER → передаёт storeId в JWT
 *   - ADMIN с MFA → mfaPending claim
 *   - successful flow → consume OTP + clear attempts + create session
 */
import { VerifyOtpUseCase } from './verify-otp.use-case';
import { AuthRepository } from '../repositories/auth.repository';
import { OtpService } from '../services/otp.service';
import { TokenService } from '../services/token.service';

const OTP_REQUEST = { id: 'otp-1', codeHash: 'hashed', expiresAt: new Date(Date.now() + 60_000) };
const USER_BUYER = { id: 'u-1', phone: '+998900000001', role: 'BUYER', buyer: { id: 'buyer-1' } };
const USER_SELLER = { id: 'u-2', phone: '+998900000002', role: 'SELLER', buyer: { id: 'buyer-2' } };
const USER_ADMIN  = { id: 'u-3', phone: '+998900000003', role: 'ADMIN',  buyer: { id: 'buyer-3' } };

describe('VerifyOtpUseCase', () => {
  let useCase: VerifyOtpUseCase;
  let authRepo: {
    findActiveOtpRequest: jest.Mock;
    consumeOtpRequest: jest.Mock;
    findUserByPhone: jest.Mock;
    createUserWithBuyer: jest.Mock;
    ensureBuyerProfile: jest.Mock;
    createSession: jest.Mock;
    findStoreIdByUserId: jest.Mock;
    findAdminClaims: jest.Mock;
  };
  let otpService: {
    checkVerifyAttempts: jest.Mock;
    verifyCode: jest.Mock;
    recordFailedAttempt: jest.Mock;
    clearVerifyAttempts: jest.Mock;
  };
  let tokenService: {
    generateRefreshToken: jest.Mock;
    hashRefreshToken: jest.Mock;
    generateAccessToken: jest.Mock;
  };

  beforeEach(() => {
    authRepo = {
      findActiveOtpRequest: jest.fn().mockResolvedValue(OTP_REQUEST),
      consumeOtpRequest:    jest.fn().mockResolvedValue(undefined),
      findUserByPhone:      jest.fn().mockResolvedValue(USER_BUYER),
      createUserWithBuyer:  jest.fn().mockResolvedValue(USER_BUYER),
      ensureBuyerProfile:   jest.fn().mockResolvedValue(undefined),
      createSession:        jest.fn().mockResolvedValue({ id: 'sess-1' }),
      findStoreIdByUserId:  jest.fn().mockResolvedValue('store-1'),
      findAdminClaims:      jest.fn().mockResolvedValue(null),
    };
    otpService = {
      checkVerifyAttempts:  jest.fn().mockResolvedValue(undefined),
      verifyCode:           jest.fn().mockResolvedValue(true),
      recordFailedAttempt:  jest.fn().mockResolvedValue(undefined),
      clearVerifyAttempts:  jest.fn().mockResolvedValue(undefined),
    };
    tokenService = {
      generateRefreshToken: jest.fn().mockReturnValue('raw-refresh'),
      hashRefreshToken:     jest.fn().mockResolvedValue('refresh-hash'),
      generateAccessToken:  jest.fn().mockReturnValue('access-token'),
    };
    useCase = new VerifyOtpUseCase(
      authRepo as unknown as AuthRepository,
      otpService as unknown as OtpService,
      tokenService as unknown as TokenService,
    );
  });

  describe('brute-force protection', () => {
    it('SEC-002: checkVerifyAttempts вызывается ДО любого DB lookup', async () => {
      const calls: string[] = [];
      otpService.checkVerifyAttempts.mockImplementation(async () => { calls.push('check'); });
      authRepo.findActiveOtpRequest.mockImplementation(async () => { calls.push('findOtp'); return OTP_REQUEST; });
      await useCase.execute('+998900000001', '123456', 'login');
      expect(calls[0]).toBe('check');
      expect(calls[1]).toBe('findOtp');
    });

    it('checkVerifyAttempts кидает rate-limit → use-case бросает', async () => {
      otpService.checkVerifyAttempts.mockRejectedValue(new Error('Too many attempts'));
      await expect(useCase.execute('+998900000001', '123456', 'login'))
        .rejects.toThrow(/Too many attempts/);
      expect(authRepo.findActiveOtpRequest).not.toHaveBeenCalled();
    });
  });

  describe('OTP validation', () => {
    it('OTP не найден → recordFailedAttempt + OTP_NOT_FOUND', async () => {
      authRepo.findActiveOtpRequest.mockResolvedValue(null);
      await expect(useCase.execute('+998900000001', '123456', 'login'))
        .rejects.toThrow(/OTP not found/);
      expect(otpService.recordFailedAttempt).toHaveBeenCalledWith('+998900000001');
    });

    it('код неверный → recordFailedAttempt + OTP_INVALID', async () => {
      otpService.verifyCode.mockResolvedValue(false);
      await expect(useCase.execute('+998900000001', '999999', 'login'))
        .rejects.toThrow(/Invalid OTP/);
      expect(otpService.recordFailedAttempt).toHaveBeenCalledWith('+998900000001');
      expect(authRepo.consumeOtpRequest).not.toHaveBeenCalled();
    });

    it('успешная верификация → consumeOtp + clearVerifyAttempts', async () => {
      await useCase.execute('+998900000001', '123456', 'login');
      expect(authRepo.consumeOtpRequest).toHaveBeenCalledWith('otp-1');
      expect(otpService.clearVerifyAttempts).toHaveBeenCalledWith('+998900000001');
    });
  });

  describe('user resolution', () => {
    it('новый юзер → createUserWithBuyer', async () => {
      authRepo.findUserByPhone.mockResolvedValue(null);
      authRepo.createUserWithBuyer.mockResolvedValue(USER_BUYER);
      await useCase.execute('+998900000001', '123456', 'login');
      expect(authRepo.createUserWithBuyer).toHaveBeenCalledWith({ phone: '+998900000001' });
      expect(authRepo.ensureBuyerProfile).not.toHaveBeenCalled();
    });

    it('existing user без buyer → ensureBuyerProfile', async () => {
      authRepo.findUserByPhone.mockResolvedValue({ ...USER_SELLER, buyer: null });
      await useCase.execute('+998900000002', '123456', 'login');
      expect(authRepo.ensureBuyerProfile).toHaveBeenCalledWith('u-2');
      expect(authRepo.createUserWithBuyer).not.toHaveBeenCalled();
    });

    it('existing user с buyer → ничего не создаём', async () => {
      await useCase.execute('+998900000001', '123456', 'login');
      expect(authRepo.createUserWithBuyer).not.toHaveBeenCalled();
      expect(authRepo.ensureBuyerProfile).not.toHaveBeenCalled();
    });
  });

  describe('JWT claims', () => {
    it('BUYER → НЕТ storeId, НЕТ admin claims', async () => {
      await useCase.execute('+998900000001', '123456', 'login');
      const payload = tokenService.generateAccessToken.mock.calls[0][0];
      expect(payload).toMatchObject({
        sub: 'u-1',
        role: 'BUYER',
        sessionId: 'sess-1',
      });
      expect(payload.storeId).toBeUndefined();
      expect(payload.mfaPending).toBeUndefined();
      expect(payload.adminRole).toBeUndefined();
    });

    it('SELLER → storeId в payload', async () => {
      authRepo.findUserByPhone.mockResolvedValue(USER_SELLER);
      authRepo.findStoreIdByUserId.mockResolvedValue('store-2');
      await useCase.execute('+998900000002', '123456', 'login');
      const payload = tokenService.generateAccessToken.mock.calls[0][0];
      expect(payload.storeId).toBe('store-2');
    });

    it('ADMIN с MFA enabled → mfaPending=true + adminRole', async () => {
      authRepo.findUserByPhone.mockResolvedValue(USER_ADMIN);
      authRepo.findAdminClaims.mockResolvedValue({ mfaEnabled: true, adminRole: 'super_admin' });
      await useCase.execute('+998900000003', '123456', 'login');
      const payload = tokenService.generateAccessToken.mock.calls[0][0];
      expect(payload.mfaPending).toBe(true);
      expect(payload.adminRole).toBe('super_admin');
    });

    it('ADMIN без MFA → adminRole есть, mfaPending отсутствует', async () => {
      authRepo.findUserByPhone.mockResolvedValue(USER_ADMIN);
      authRepo.findAdminClaims.mockResolvedValue({ mfaEnabled: false, adminRole: 'moderator' });
      await useCase.execute('+998900000003', '123456', 'login');
      const payload = tokenService.generateAccessToken.mock.calls[0][0];
      expect(payload.mfaPending).toBeUndefined();
      expect(payload.adminRole).toBe('moderator');
    });
  });

  describe('session', () => {
    it('refreshToken имеет формат "<sessionId>.<rawToken>"', async () => {
      const result = await useCase.execute('+998900000001', '123456', 'login');
      const [sessionPart] = result.refreshToken.split('.');
      expect(authRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: sessionPart, userId: 'u-1' }),
      );
    });

    it('expiresAt = +30 days', async () => {
      const before = Date.now();
      await useCase.execute('+998900000001', '123456', 'login');
      const sessionArg = authRepo.createSession.mock.calls[0][0];
      const elapsedMs = sessionArg.expiresAt.getTime() - before;
      const expectedMs = 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(elapsedMs - expectedMs)).toBeLessThan(5_000); // 5s tolerance
    });

    it('передаёт meta (deviceType/ipAddress/userAgent) в session', async () => {
      await useCase.execute('+998900000001', '123456', 'login', {
        deviceType: 'web',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(authRepo.createSession).toHaveBeenCalledWith(expect.objectContaining({
        deviceType: 'web',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }));
    });
  });

  describe('return shape', () => {
    it('возвращает accessToken + refreshToken + user (id/phone/role)', async () => {
      const result = await useCase.execute('+998900000001', '123456', 'login');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: expect.stringMatching(/.+\..+/),
        user: { id: 'u-1', phone: '+998900000001', role: 'BUYER' },
      });
    });
  });
});
