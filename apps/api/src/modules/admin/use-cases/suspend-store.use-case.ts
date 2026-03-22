import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class SuspendStoreUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  // INV-A01: AuditLog is mandatory for every admin action.
  // INV-A02: Suspension requires a reason (enforced by AdminActionDto).
  async execute(storeId: string, actorUserId: string, reason: string) {
    const store = await this.adminRepo.findStoreById(storeId);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    if (store.status === 'SUSPENDED') {
      throw new DomainException(
        ErrorCode.ADMIN_STORE_ALREADY_SUSPENDED,
        'Store is already suspended',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.adminRepo.updateStoreStatus(storeId, 'SUSPENDED');

    // INV-A01
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'STORE_SUSPENDED',
      entityType: 'Store',
      entityId: storeId,
      payload: { reason, adminId: actorUserId, previousStatus: store.status },
    });

    return updated;
  }
}
