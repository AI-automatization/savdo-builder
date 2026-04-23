import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';
import { RedisService } from '../../../shared/redis.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

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
          this.logger.log(`Linked telegramId=${telegramId} to existing user phone=${phoneFromBot}`);
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

    const accessToken = this.tokenService.generateAccessToken({
      sub: resolvedUser.id,
      role: resolvedUser.role,
      sessionId: session.id,
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
