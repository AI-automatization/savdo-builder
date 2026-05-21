/**
 * Тесты для `RefreshSessionUseCase`.
 *
 * SECURITY-CRITICAL — refresh token rotation. Покрытие:
 *   - формат токена `${sessionId}.${random}` — без точки → INVALID
 *   - session не найден → INVALID
 *   - session expired → INVALID
 *   - hash mismatch → INVALID (защита от подделки)
 *   - user blocked → UNAUTHORIZED
 *   - happy path: ротация — новый refresh token + обновление hash + lastSeenAt
 *   - SELLER → storeId в JWT
 *   - ADMIN → adminClaims (mfaEnabled, adminRole)
 */
import { RefreshSessionUseCase } from './refresh-session.use-case';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const SESSION = {
  id: 'sess-1',
  userId: 'u-1',
  refreshTokenHash: 'old-hash',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

const USER_BUYER = { id: 'u-1', role: 'BUYER', status: 'ACTIVE', phone: '+998900000001' };

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;
  let authRepo: {
    findSessionById: jest.Mock;
    findStoreIdByUserId: jest.Mock;
    findAdminClaims: jest.Mock;
  };
  let tokenService: {
    verifyRefreshToken: jest.Mock;
    generateRefreshToken: jest.Mock;
    hashRefreshToken: jest.Mock;
    generateAccessToken: jest.Mock;
  };
  let prisma: {
    user: { findUnique: jest.Mock };
    userSession: { update: jest.Mock };
  };

  beforeEach(() => {
    authRepo = {
      findSessionById: jest.fn().mockResolvedValue(SESSION),
      findStoreIdByUserId: jest.fn().mockResolvedValue('store-1'),
      findAdminClaims: jest.fn().mockResolvedValue(null),
    };
    tokenService = {
      verifyRefreshToken: jest.fn().mockResolvedValue(true),
      generateRefreshToken: jest.fn().mockReturnValue('newrandom'),
      hashRefreshToken: jest.fn().mockResolvedValue('new-hash'),
      generateAccessToken: jest.fn().mockReturnValue('new.access.token'),
    };
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(USER_BUYER) },
      userSession: { update: jest.fn().mockResolvedValue(undefined) },
    };
    useCase = new RefreshSessionUseCase(
      authRepo as unknown as AuthRepository,
      tokenService as unknown as TokenService,
      prisma as unknown as PrismaService,
    );
  });

  describe('token format', () => {
    it('без точки → INVALID', async () => {
      await expect(useCase.execute('no-dot-here')).rejects.toThrow(DomainException);
      try {
        await useCase.execute('no-dot-here');
      } catch (err) {
        expect((err as DomainException).code).toBe(ErrorCode.REFRESH_TOKEN_INVALID);
      }
    });

    it('пустой sessionId перед точкой → INVALID', async () => {
      await expect(useCase.execute('.tokenpart')).rejects.toThrow(/Invalid refresh token/);
    });
  });

  describe('session validation', () => {
    it('session не найдена → INVALID', async () => {
      authRepo.findSessionById.mockResolvedValue(null);
      await expect(useCase.execute('sess-1.token')).rejects.toThrow(/expired or not found/);
    });

    it('session expired → INVALID', async () => {
      authRepo.findSessionById.mockResolvedValue({
        ...SESSION,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(useCase.execute('sess-1.token')).rejects.toThrow(/expired or not found/);
    });

    it('verifyRefreshToken=false → INVALID (защита от подделки)', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(false);
      await expect(useCase.execute('sess-1.token')).rejects.toThrow(/Invalid refresh token/);
    });
  });

  describe('user validation', () => {
    it('user не найден → UNAUTHORIZED', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(useCase.execute('sess-1.token')).rejects.toThrow(/User not found or blocked/);
    });

    it('user.status=BLOCKED → UNAUTHORIZED', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...USER_BUYER, status: 'BLOCKED' });
      await expect(useCase.execute('sess-1.token')).rejects.toThrow(/blocked/);
    });
  });

  describe('happy path — token rotation', () => {
    it('возвращает {accessToken, refreshToken}', async () => {
      const result = await useCase.execute('sess-1.token');
      expect(result.accessToken).toBe('new.access.token');
      expect(result.refreshToken).toBe('sess-1.newrandom');
    });

    it('обновляет refreshTokenHash + expiresAt + lastSeenAt в session', async () => {
      await useCase.execute('sess-1.token');
      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: expect.objectContaining({
          refreshTokenHash: 'new-hash',
          expiresAt: expect.any(Date),
          lastSeenAt: expect.any(Date),
        }),
      });
    });

    it('новый refreshToken хешируется ПОСЛЕ генерации', async () => {
      await useCase.execute('sess-1.token');
      expect(tokenService.generateRefreshToken).toHaveBeenCalled();
      expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('sess-1.newrandom');
    });
  });

  describe('JWT claims', () => {
    it('BUYER → без storeId/adminRole', async () => {
      await useCase.execute('sess-1.token');
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
        sub: 'u-1',
        role: 'BUYER',
        sessionId: 'sess-1',
      }));
      const claims = tokenService.generateAccessToken.mock.calls[0][0];
      expect(claims.storeId).toBeUndefined();
      expect(claims.adminRole).toBeUndefined();
    });

    it('SELLER → storeId в JWT', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...USER_BUYER, role: 'SELLER' });
      authRepo.findStoreIdByUserId.mockResolvedValue('store-42');
      await useCase.execute('sess-1.token');
      expect(authRepo.findStoreIdByUserId).toHaveBeenCalledWith('u-1');
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
        storeId: 'store-42',
      }));
    });

    it('ADMIN с mfa → mfaPending=true + adminRole', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...USER_BUYER, role: 'ADMIN' });
      authRepo.findAdminClaims.mockResolvedValue({ mfaEnabled: true, adminRole: 'super_admin' });
      await useCase.execute('sess-1.token');
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
        role: 'ADMIN',
        mfaPending: true,
        adminRole: 'super_admin',
      }));
    });

    it('ADMIN без mfa → adminRole + mfaPending=true (SEC-ADMIN стадия C)', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...USER_BUYER, role: 'ADMIN' });
      authRepo.findAdminClaims.mockResolvedValue({ mfaEnabled: false, adminRole: 'moderator' });
      await useCase.execute('sess-1.token');
      const claims = tokenService.generateAccessToken.mock.calls[0][0];
      expect(claims.adminRole).toBe('moderator');
      // Стадия C: refresh не должен выдавать чистый токен админу без MFA.
      expect(claims.mfaPending).toBe(true);
    });

    it('BUYER → findAdminClaims НЕ вызывается', async () => {
      await useCase.execute('sess-1.token');
      expect(authRepo.findAdminClaims).not.toHaveBeenCalled();
    });
  });
});
