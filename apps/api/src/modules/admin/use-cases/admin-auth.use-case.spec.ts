/**
 * Тесты для `AdminAuthUseCase` — MFA setup/verify/disable/challenge.
 * Критично: TOTP-логика. Любой баг даёт privilege escalation.
 */
import { AdminAuthUseCase } from './admin-auth.use-case';
import { PrismaService } from '../../../database/prisma.service';
import { TokenService } from '../../auth/services/token.service';
import { AuthRepository } from '../../auth/repositories/auth.repository';

// Мокаем otplib (v13 functional API) чтобы тесты были детерминированными.
jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'TEST_SECRET_BASE32'),
  generateURI: jest.fn((opts: { issuer: string; label: string; secret: string }) =>
    `otpauth://totp/${opts.issuer}:${opts.label}?secret=${opts.secret}`,
  ),
  verifySync: jest.fn(),
}));
import { generateSecret, verifySync } from 'otplib';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,FAKEQR'),
}));

describe('AdminAuthUseCase', () => {
  let useCase: AdminAuthUseCase;
  let prisma: { adminUser: { findUnique: jest.Mock; update: jest.Mock }; user: { findUnique: jest.Mock } };
  let tokenService: jest.Mocked<TokenService>;
  let authRepo: jest.Mocked<AuthRepository>;

  const ADMIN = {
    id: 'admin-1',
    userId: 'u-1',
    adminRole: 'admin',
    isSuperadmin: false,
    mfaEnabled: false,
    mfaSecret: null as string | null,
    lastLoginAt: null,
  };

  beforeEach(() => {
    prisma = {
      adminUser: {
        findUnique: jest.fn().mockResolvedValue(ADMIN),
        update: jest.fn().mockResolvedValue(ADMIN),
      },
      user: { findUnique: jest.fn() },
    };
    tokenService = {
      generateAccessToken: jest.fn().mockReturnValue('NEW_JWT'),
    } as unknown as jest.Mocked<TokenService>;
    authRepo = {
      createSession: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    useCase = new AdminAuthUseCase(prisma as unknown as PrismaService, tokenService, authRepo);
    (verifySync as jest.Mock).mockReset();
    (generateSecret as jest.Mock).mockClear();
  });

  describe('getMe', () => {
    it('возвращает permissions по adminRole + user info', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        ...ADMIN,
        adminRole: 'admin',
        user: { phone: '+998900000000', telegramId: BigInt(123), role: 'ADMIN' },
      });
      const me = await useCase.getMe('u-1');
      expect(me.adminRole).toBe('admin');
      expect(me.permissions).toEqual(expect.arrayContaining(['user:*', 'store:*']));
    });

    it('БРОСАЕТ 403 если admin record не найден', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);
      await expect(useCase.getMe('u-1')).rejects.toThrow(/Admin record not found/);
    });
  });

  describe('setupMfa', () => {
    it('генерирует secret + сохраняет + возвращает QR', async () => {
      const result = await useCase.setupMfa('u-1', '+998900000000');
      expect(generateSecret).toHaveBeenCalled();
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { mfaSecret: 'TEST_SECRET_BASE32' },
      });
      expect(result).toEqual({
        secret: 'TEST_SECRET_BASE32',
        otpauthUrl: expect.stringContaining('otpauth://totp/'),
        qrDataUrl: expect.stringContaining('data:image/png'),
      });
    });

    it('БРОСАЕТ если MFA уже включена (защита от случайного re-setup)', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: true, mfaSecret: 'OLD' });
      await expect(useCase.setupMfa('u-1', '+998')).rejects.toThrow(/already enabled/);
    });
  });

  describe('verifyMfa', () => {
    it('успешный код → mfaEnabled=true', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaSecret: 'PENDING' });
      (verifySync as jest.Mock).mockReturnValue({ valid: true, delta: 0 });
      const result = await useCase.verifyMfa('u-1', '123456');
      expect(verifySync).toHaveBeenCalledWith(expect.objectContaining({ token: '123456', secret: 'PENDING' }));
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: expect.objectContaining({ mfaEnabled: true }),
      });
      expect(result).toEqual({ ok: true });
    });

    it('БРОСАЕТ если код неверный', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaSecret: 'X' });
      (verifySync as jest.Mock).mockReturnValue({ valid: false });
      await expect(useCase.verifyMfa('u-1', '000000')).rejects.toThrow(/Invalid TOTP/);
      expect(prisma.adminUser.update).not.toHaveBeenCalled();
    });

    it('БРОСАЕТ если /setup не был вызван (mfaSecret отсутствует)', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaSecret: null });
      await expect(useCase.verifyMfa('u-1', '123456')).rejects.toThrow(/No MFA setup pending/);
    });
  });

  describe('disableMfa', () => {
    it('требует валидный TOTP код для отключения (защита от стащенного JWT)', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: true, mfaSecret: 'X' });
      (verifySync as jest.Mock).mockReturnValue({ valid: false });
      await expect(useCase.disableMfa('u-1', '000000')).rejects.toThrow(/Invalid TOTP/);
      expect(prisma.adminUser.update).not.toHaveBeenCalled();
    });

    it('успех с валидным кодом → mfaEnabled=false + secret=null', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: true, mfaSecret: 'X' });
      (verifySync as jest.Mock).mockReturnValue({ valid: true, delta: 0 });
      await useCase.disableMfa('u-1', '123456');
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: expect.objectContaining({ mfaEnabled: false, mfaSecret: null }),
      });
    });

    it('БРОСАЕТ если MFA не включена', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: false });
      await expect(useCase.disableMfa('u-1', '123456')).rejects.toThrow(/MFA not enabled/);
    });
  });

  describe('mfaChallenge — критичный flow для login', () => {
    it('успешный код → re-issue JWT БЕЗ mfaPending, тот же sessionId', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: true, mfaSecret: 'X', adminRole: 'super_admin' });
      (verifySync as jest.Mock).mockReturnValue({ valid: true, delta: 0 });
      const res = await useCase.mfaChallenge('u-1', '123456', 'session-abc', 'ADMIN');
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: 'u-1',
        role: 'ADMIN',
        sessionId: 'session-abc',
        adminRole: 'super_admin',
      });
      expect(res).toEqual({ accessToken: 'NEW_JWT' });
    });

    it('updateLastLoginAt записывается при успехе', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: true, mfaSecret: 'X' });
      (verifySync as jest.Mock).mockReturnValue({ valid: true, delta: 0 });
      await useCase.mfaChallenge('u-1', '123456', 'sid', 'ADMIN');
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      });
    });

    it('БРОСАЕТ MFA_INVALID при неверном коде', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: true, mfaSecret: 'X' });
      (verifySync as jest.Mock).mockReturnValue({ valid: false });
      await expect(useCase.mfaChallenge('u-1', '000000', 'sid', 'ADMIN')).rejects.toThrow(/Invalid TOTP/);
      expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('safety: если mfaEnabled=false → БРОСАЕТ (guard логически не должен пропустить)', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...ADMIN, mfaEnabled: false });
      await expect(useCase.mfaChallenge('u-1', '123456', 'sid', 'ADMIN')).rejects.toThrow(/MFA not enabled/);
    });
  });
});
