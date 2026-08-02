import { randomBytes } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { AuditService } from '../../audit/audit.service';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { PartnerApiKeysRepository } from '../repositories/partner-api-keys.repository';
import { sha256Hex } from '../guards/partner-api-key.guard';

/**
 * PARTNER-API-RAOS-001: выдача/список/отзыв партнёрских ключей (admin-панель).
 * Plaintext ключа возвращается ОДИН раз при выдаче — дальше только hash в БД.
 */
@Injectable()
export class ManagePartnerKeysUseCase {
  constructor(
    private readonly keysRepo: PartnerApiKeysRepository,
    private readonly storesRepo: StoresRepository,
    private readonly audit: AuditService,
  ) {}

  async issue(actorUserId: string, storeId: string, name: string) {
    const store = await this.storesRepo.findById(storeId);
    if (!store) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // msk_ + 40 hex = 44 символа; префикс позволяет опознать ключ в логах/секретах.
    const rawKey = `msk_${randomBytes(20).toString('hex')}`;
    const key = await this.keysRepo.create({
      keyHash: sha256Hex(rawKey),
      name,
      storeId,
    });

    await this.audit.write({
      actorUserId,
      action: 'partner_key.issued',
      entityType: 'partner_api_key',
      entityId: key.id,
      payload: { storeId, name },
    });

    // ЕДИНСТВЕННОЕ место, где plaintext покидает сервер.
    return { id: key.id, name: key.name, storeId: key.storeId, apiKey: rawKey };
  }

  async list() {
    return this.keysRepo.findAll();
  }

  async revoke(actorUserId: string, keyId: string) {
    const key = await this.keysRepo.findById(keyId);
    if (!key) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Partner API key not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const revoked = await this.keysRepo.revoke(keyId);

    await this.audit.write({
      actorUserId,
      action: 'partner_key.revoked',
      entityType: 'partner_api_key',
      entityId: keyId,
      payload: { storeId: key.storeId, name: key.name },
    });

    return { id: revoked.id, isActive: revoked.isActive, revokedAt: revoked.revokedAt };
  }
}
