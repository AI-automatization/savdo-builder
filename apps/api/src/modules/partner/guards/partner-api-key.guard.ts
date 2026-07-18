import { createHash } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PartnerApiKeysRepository } from '../repositories/partner-api-keys.repository';

// Контекст, который guard кладёт в request для partner-контроллера.
export interface PartnerContext {
  keyId: string;
  keyName: string;
  storeId: string;
  storeSlug: string;
  sellerId: string;
  // Владелец магазина — становится ownerUserId загружаемых media.
  sellerUserId: string;
}

export type PartnerRequest = Request & { partnerContext?: PartnerContext };

export function sha256Hex(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * PARTNER-API-RAOS-001: аутентификация внешнего партнёра по заголовку
 * `X-Api-Key`. Endpoint при этом помечен @Public (глобальный JwtAuthGuard
 * пропускает), реальную проверку делает этот guard. В БД хранится только
 * sha256-hash ключа. Ключ скоупит запрос на ОДИН магазин.
 */
@Injectable()
export class PartnerApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(PartnerApiKeyGuard.name);

  constructor(private readonly keysRepo: PartnerApiKeysRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<PartnerRequest>();
    const rawKey = req.header('x-api-key');

    if (!rawKey || rawKey.length < 16) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'X-Api-Key header required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const key = await this.keysRepo.findActiveByHash(sha256Hex(rawKey));
    if (!key || key.store.seller.isBlocked) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Invalid or revoked API key',
        HttpStatus.UNAUTHORIZED,
      );
    }

    req.partnerContext = {
      keyId: key.id,
      keyName: key.name,
      storeId: key.store.id,
      storeSlug: key.store.slug,
      sellerId: key.store.seller.id,
      sellerUserId: key.store.seller.userId,
    };

    // lastUsedAt — телеметрия, не блокируем запрос и не роняем его при сбое.
    void this.keysRepo.touchLastUsed(key.id).catch((err) => {
      this.logger.warn(`touchLastUsed failed for key=${key.id}: ${err instanceof Error ? err.message : String(err)}`);
    });

    return true;
  }
}
