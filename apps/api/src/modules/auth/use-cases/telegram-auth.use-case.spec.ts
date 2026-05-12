/**
 * Тесты для `TelegramAuthUseCase`.
 *
 * SECURITY-CRITICAL — Telegram WebApp initData validation. Покрытие:
 *   - botToken не настроен → INTERNAL_ERROR
 *   - Missing hash / user → VALIDATION_ERROR
 *   - HMAC mismatch → UNAUTHORIZED (timingSafeEqual)
 *   - Invalid user JSON → VALIDATION_ERROR
 *   - Existing user by telegramId → reuse session
 *   - New user via Redis tg:phone → linkTelegramId (привязка к web-аккаунту)
 *   - New user без bot share → createUserWithBuyerByTelegram
 *   - SELLER → storeId, ADMIN → adminClaims в JWT
 */
import { createHmac } from 'crypto';
import { TelegramAuthUseCase } from './telegram-auth.use-case';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';
import { RedisService } from '../../../shared/redis.service';

const BOT_TOKEN = 'TEST_BOT_TOKEN';

function buildInitData(userObj: any, validHash: boolean = true): string {
  const params = new URLSearchParams();
  params.set('user', JSON.stringify(userObj));
  params.set('auth_date', '1735689600');

  if (!validHash) {
    params.set('hash', 'invalid-hash-here');
    return params.toString();
  }

  // Build the data_check_string как в продукте: sorted keys, без hash
  const arr: string[] = [];
  params.forEach((v, k) => {
    if (k !== 'hash') arr.push(`${k}=${v}`);
  });
  arr.sort();
  const dataCheckString = arr.join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

const USER_BUYER = { id: 'u-1', role: 'BUYER', phone: '+998900000001', telegramId: BigInt(111) };

describe('TelegramAuthUseCase', () => {
  let useCase: TelegramAuthUseCase;
  let authRepo: {
    findUserByTelegramId: jest.Mock;
    findUserByPhone: jest.Mock;
    linkTelegramId: jest.Mock;
    clearTelegramIdIfGhost: jest.Mock;
    createUserWithBuyerByTelegram: jest.Mock;
    createSession: jest.Mock;
    findStoreIdByUserId: jest.Mock;
    findAdminClaims: jest.Mock;
  };
  let tokenService: {
    generateRefreshToken: jest.Mock;
    hashRefreshToken: jest.Mock;
    generateAccessToken: jest.Mock;
  };
  let redis: { get: jest.Mock };

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
    authRepo = {
      findUserByTelegramId: jest.fn().mockResolvedValue(null),
      findUserByPhone: jest.fn().mockResolvedValue(null),
      linkTelegramId: jest.fn(),
      clearTelegramIdIfGhost: jest.fn().mockResolvedValue(undefined),
      createUserWithBuyerByTelegram: jest.fn().mockResolvedValue(USER_BUYER),
      createSession: jest.fn().mockImplementation(async (s) => s),
      findStoreIdByUserId: jest.fn().mockResolvedValue(null),
      findAdminClaims: jest.fn().mockResolvedValue(null),
    };
    tokenService = {
      generateRefreshToken: jest.fn().mockReturnValue('rawtoken'),
      hashRefreshToken: jest.fn().mockResolvedValue('hashed'),
      generateAccessToken: jest.fn().mockReturnValue('access.token'),
    };
    redis = { get: jest.fn().mockResolvedValue(null) };
    useCase = new TelegramAuthUseCase(
      authRepo as unknown as AuthRepository,
      tokenService as unknown as TokenService,
      redis as unknown as RedisService,
    );
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  describe('preconditions', () => {
    it('TELEGRAM_BOT_TOKEN не настроен → INTERNAL_ERROR (через wrapper)', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      await expect(useCase.execute('initData=x'))
        .rejects.toThrow(/Telegram bot not configured/);
    });

    it('hash отсутствует → VALIDATION_ERROR', async () => {
      const initData = 'user=' + encodeURIComponent('{"id":111}');
      await expect(useCase.execute(initData))
        .rejects.toThrow(/Missing hash/);
    });

    it('HMAC mismatch → UNAUTHORIZED', async () => {
      const initData = buildInitData({ id: 111 }, false);
      await expect(useCase.execute(initData))
        .rejects.toThrow(/Invalid Telegram initData signature/);
    });

    it('user отсутствует в params → VALIDATION_ERROR', async () => {
      const params = new URLSearchParams();
      params.set('auth_date', '1735689600');
      const arr: string[] = [];
      params.forEach((v, k) => arr.push(`${k}=${v}`));
      arr.sort();
      const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
      const hash = createHmac('sha256', secretKey).update(arr.join('\n')).digest('hex');
      params.set('hash', hash);
      await expect(useCase.execute(params.toString()))
        .rejects.toThrow(/Missing user in initData/);
    });

    it('user JSON невалидный → VALIDATION_ERROR', async () => {
      const params = new URLSearchParams();
      params.set('user', '{not-json}');
      const arr: string[] = [];
      params.forEach((v, k) => arr.push(`${k}=${v}`));
      arr.sort();
      const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
      const hash = createHmac('sha256', secretKey).update(arr.join('\n')).digest('hex');
      params.set('hash', hash);
      await expect(useCase.execute(params.toString()))
        .rejects.toThrow(/Invalid user JSON/);
    });
  });

  describe('user resolution', () => {
    it('existing user by telegramId → reuse', async () => {
      authRepo.findUserByTelegramId.mockResolvedValue(USER_BUYER);
      const result = await useCase.execute(buildInitData({ id: 111 }));
      expect(authRepo.createUserWithBuyerByTelegram).not.toHaveBeenCalled();
      expect(authRepo.linkTelegramId).not.toHaveBeenCalled();
      expect(result.user).toEqual({ id: 'u-1', role: 'BUYER', phone: '+998900000001' });
    });

    it('новый telegramId, но в Redis есть phone → linkTelegramId на existing user', async () => {
      redis.get.mockResolvedValue('+998900000001');
      authRepo.findUserByPhone.mockResolvedValue({ id: 'u-existing', telegramId: null });
      authRepo.linkTelegramId.mockResolvedValue({ ...USER_BUYER, id: 'u-existing' });
      await useCase.execute(buildInitData({ id: 111 }));
      expect(authRepo.clearTelegramIdIfGhost).toHaveBeenCalledWith(BigInt(111));
      expect(authRepo.linkTelegramId).toHaveBeenCalledWith('u-existing', BigInt(111));
      expect(authRepo.createUserWithBuyerByTelegram).not.toHaveBeenCalled();
    });

    it('Redis-phone match но user уже имеет telegramId → НЕ link (reuse byPhone)', async () => {
      redis.get.mockResolvedValue('+998900000001');
      authRepo.findUserByPhone.mockResolvedValue({
        ...USER_BUYER, id: 'u-other', telegramId: BigInt(999),
      });
      await useCase.execute(buildInitData({ id: 111 }));
      expect(authRepo.linkTelegramId).not.toHaveBeenCalled();
      expect(authRepo.createUserWithBuyerByTelegram).not.toHaveBeenCalled();
    });

    it('новый telegramId, нет Redis → createUserWithBuyerByTelegram', async () => {
      redis.get.mockResolvedValue(null);
      await useCase.execute(buildInitData({ id: 111, phone: '+998900000001' }));
      expect(authRepo.createUserWithBuyerByTelegram).toHaveBeenCalledWith({
        telegramId: BigInt(111),
        phone: '+998900000001',
      });
    });
  });

  describe('JWT claims', () => {
    it('SELLER → storeId в JWT', async () => {
      authRepo.findUserByTelegramId.mockResolvedValue({ ...USER_BUYER, role: 'SELLER' });
      authRepo.findStoreIdByUserId.mockResolvedValue('store-42');
      await useCase.execute(buildInitData({ id: 111 }));
      expect(authRepo.findStoreIdByUserId).toHaveBeenCalledWith('u-1');
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
        role: 'SELLER',
        storeId: 'store-42',
      }));
    });

    it('ADMIN с MFA → mfaPending + adminRole', async () => {
      authRepo.findUserByTelegramId.mockResolvedValue({ ...USER_BUYER, role: 'ADMIN' });
      authRepo.findAdminClaims.mockResolvedValue({ mfaEnabled: true, adminRole: 'super_admin' });
      await useCase.execute(buildInitData({ id: 111 }));
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
        role: 'ADMIN',
        mfaPending: true,
        adminRole: 'super_admin',
      }));
    });

    it('BUYER → нет storeId/adminRole/mfaPending', async () => {
      authRepo.findUserByTelegramId.mockResolvedValue(USER_BUYER);
      await useCase.execute(buildInitData({ id: 111 }));
      const claims = tokenService.generateAccessToken.mock.calls[0][0];
      expect(claims.storeId).toBeUndefined();
      expect(claims.adminRole).toBeUndefined();
      expect(claims.mfaPending).toBeUndefined();
    });
  });

  describe('return shape', () => {
    it('возвращает {token, refreshToken, user}', async () => {
      authRepo.findUserByTelegramId.mockResolvedValue(USER_BUYER);
      const result = await useCase.execute(buildInitData({ id: 111 }));
      expect(result.token).toBe('access.token');
      expect(result.refreshToken).toMatch(/^[a-f0-9-]+\.rawtoken$/);
      expect(result.user).toEqual({ id: 'u-1', role: 'BUYER', phone: '+998900000001' });
    });
  });
});
