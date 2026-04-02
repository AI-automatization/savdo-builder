import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class RejectStoreUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  // INV-A01: AuditLog is mandatory for every admin action.
  // INV-A02: Rejection requires a reason (enforced by AdminActionDto).
  async execute(storeId: string, actorUserId: string, reason: string) {
    const store = await this.adminRepo.findStoreById(storeId);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    if (store.status === 'REJECTED') {
      throw new DomainException(
        ErrorCode.ADMIN_STORE_ALREADY_REJECTED,
        'Store is already rejected',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.adminRepo.updateStoreStatus(storeId, 'REJECTED');

    // INV-A01
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'STORE_REJECTED',
      entityType: 'Store',
      entityId: storeId,
      payload: { reason, adminId: actorUserId, previousStatus: store.status },
    });

    return updated;
  }
}
