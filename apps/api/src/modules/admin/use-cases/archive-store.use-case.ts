import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class ArchiveStoreUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  // INV-A01: AuditLog is mandatory for every admin action.
  // INV-A02: Archive requires a reason (enforced by AdminActionDto).
  async execute(storeId: string, actorUserId: string, reason: string) {
    const store = await this.adminRepo.findStoreById(storeId);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    if (store.status === 'ARCHIVED') {
      throw new DomainException(
        ErrorCode.ADMIN_STORE_ALREADY_ARCHIVED,
        'Store is already archived',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.adminRepo.updateStoreStatus(storeId, 'ARCHIVED');

    // INV-A01
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'STORE_ARCHIVED',
      entityType: 'Store',
      entityId: storeId,
      payload: { reason, adminId: actorUserId, previousStatus: store.status },
    });

    return updated;
  }
}
