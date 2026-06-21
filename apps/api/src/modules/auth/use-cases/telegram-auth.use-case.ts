import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';
import { RedisService } from '../../../shared/redis.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { maskPhone } from '../../../shared/pii';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class TelegramAuthUseCase {
  private readonly logger = new Logger(TelegramAuthUseCase.name);

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly redis: RedisService,
  ) {}

  async execute(initData: string) {
    try {
      return await this.executeUnsafe(initData);
    } catch (err) {
      // Diagnostic: 06.05 был 500 без stacktrace в Railway logs — buyer не мог
      // войти в TMA. Log стейдж/тип ошибки чтобы быстрее находить root cause.
      if (err instanceof DomainException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`/auth/telegram unhandled: ${msg}`, stack);
      throw new DomainException(
        ErrorCode.INTERNAL_ERROR,
        `Telegram auth failed: ${msg.slice(0, 200)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async executeUnsafe(initData: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new DomainException(ErrorCode.INTERNAL_ERROR, 'Telegram bot not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'Missing hash in initData', HttpStatus.BAD_REQUEST);
    }

    // Build data_check_string (sorted keys, excluding hash)
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Validate HMAC-SHA256
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const hashMatch = (() => {
      try {
        return timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(hash, 'hex'));
      } catch {
        return false;
      }
    })();
    if (!hashMatch) {
      throw new DomainException(ErrorCode.UNAUTHORIZED, 'Invalid Telegram initData signature', HttpStatus.UNAUTHORIZED);
    }

    // A2-TG-REPLAY-001: Telegram docs recommend rejecting initData older than 24h.
    // Without this check, an intercepted initData is valid indefinitely.
    const authDate = params.get('auth_date');
    if (!authDate) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'Missing auth_date in initData', HttpStatus.BAD_REQUEST);
    }
    const authDateMs = Number(authDate) * 1000;
    if (isNaN(authDateMs) || Date.now() - authDateMs > 24 * 60 * 60 * 1000) {
      throw new DomainException(ErrorCode.UNAUTHORIZED, 'Telegram initData has expired', HttpStatus.UNAUTHORIZED);
    }

    // Parse user from initData
    const userParam = params.get('user');
    if (!userParam) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'Missing user in initData', HttpStatus.BAD_REQUEST);
    }

    let tgUser: { id: number; username?: string; phone?: string };
    try {
      tgUser = JSON.parse(userParam);
    } catch {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'Invalid user JSON in initData', HttpStatus.BAD_REQUEST);
    }

    const telegramId = BigInt(tgUser.id);

    // 1. Ищем по telegramId
    let resolvedUser = await this.authRepo.findUserByTelegramId(telegramId);

    if (!resolvedUser) {
      // 2. Проверяем Redis: вдруг юзер уже шарил номер в боте
      //    Ключ tg:phone:{chatId} хранится в webhook-контроллере при шаринге контакта
      const phoneFromBot = await this.redis.get(`tg:phone:${tgUser.id}`).catch(() => null);

      if (phoneFromBot) {
        const byPhone = await this.authRepo.findUserByPhone(phoneFromBot);
        if (byPhone && !byPhone.telegramId) {
          // Сначала убираем telegramId у ghost-аккаунта (если есть)
          await this.authRepo.clearTelegramIdIfGhost(telegramId);
          // Привязываем telegramId к существующему web-аккаунту
          resolvedUser = await this.authRepo.linkTelegramId(byPhone.id, telegramId);
          this.logger.log(`Linked telegramId=${telegramId} to existing user phone=${maskPhone(phoneFromBot)}`);
        } else if (byPhone) {
          resolvedUser = byPhone;
        }
      }

      if (!resolvedUser) {
        // 3. Создаём нового пользователя
        resolvedUser = await this.authRepo.createUserWithBuyerByTelegram({
          telegramId,
          phone: tgUser.phone,
        });
        this.logger.log(`New Telegram user created: telegramId=${telegramId}`);
      }
    }

    // API-USER-LOGIN-BLOCK-001 + API-AUTO-RESTORE-001: гард soft-deleted / BLOCKED
    // на входе. ПОРЯДОК ПРОВЕРОК ВАЖЕН — deletedAt FIRST, потом status:
    //   1. deletedAt set И в окне 90 дней → авто-restore (self-delete grace period).
    //   2. deletedAt set И старше 90 дней → 403 ACCOUNT_PERMANENTLY_DELETED.
    //   3. deletedAt = null, status='BLOCKED' → admin-ban, 403 UNAUTHORIZED.
    //   4. остальное → обычный login.
    // Перепутать порядок нельзя: softDeleteUserTx ставит deletedAt+BLOCKED
    // ОБА, а admin-ban — только status=BLOCKED. Auto-restore допустим строго
    // для self-delete, иначе админский бан обходился бы «перелогином».
    if (resolvedUser.deletedAt) {
      const outcome = await this.authRepo.restoreUserIfWithinGrace(resolvedUser.id);
      if (outcome.state === 'restored') {
        resolvedUser.deletedAt = null;
        resolvedUser.status = 'ACTIVE';
        this.logger.warn(
          `Account restored within grace period: user=${resolvedUser.id} previousDeletedAt=${outcome.previousDeletedAt.toISOString()}`,
        );
      } else if (outcome.state === 'expired') {
        this.logger.warn(
          `Login blocked (permanently deleted): user=${resolvedUser.id} deletedAt=${outcome.deletedAt.toISOString()}`,
        );
        throw new DomainException(
          ErrorCode.ACCOUNT_PERMANENTLY_DELETED,
          'Аккаунт удалён безвозвратно. Зарегистрируйтесь заново.',
          HttpStatus.FORBIDDEN,
        );
      }
      // state === 'not_deleted' — гонка (другой запрос уже восстановил), продолжаем.
    } else if (resolvedUser.status === 'BLOCKED') {
      // Admin-suspended (без deletedAt) — auto-restore НЕ применяется.
      this.logger.warn(
        `Login blocked (admin-suspended): user=${resolvedUser.id} status=${resolvedUser.status}`,
      );
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Account is suspended',
        HttpStatus.FORBIDDEN,
      );
    }

    // Create session
    const sessionId = randomUUID();
    const rawToken = this.tokenService.generateRefreshToken();
    const refreshToken = `${sessionId}.${rawToken}`;
    const refreshTokenHash = await this.tokenService.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const session = await this.authRepo.createSession({
      id: sessionId,
      userId: resolvedUser.id,
      refreshTokenHash,
      expiresAt,
    });

    const storeId = resolvedUser.role === 'SELLER'
      ? await this.authRepo.findStoreIdByUserId(resolvedUser.id)
      : undefined;

    // API-MFA-NOT-ENFORCED-001 + API-RBAC-MICRO-PERMISSIONS-001
    const adminClaims = resolvedUser.role === 'ADMIN'
      ? await this.authRepo.findAdminClaims(resolvedUser.id)
      : null;

    const accessToken = this.tokenService.generateAccessToken({
      sub: resolvedUser.id,
      role: resolvedUser.role,
      sessionId: session.id,
      ...(storeId && { storeId }),
      // SEC-ADMIN-ACCESS-MODEL стадия C: mfaPending у любого админа.
      ...(adminClaims && { mfaPending: true }),
      ...(adminClaims?.adminRole && { adminRole: adminClaims.adminRole }),
    });

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: resolvedUser.id,
        role: resolvedUser.role,
        phone: resolvedUser.phone,
      },
    };
  }
}
