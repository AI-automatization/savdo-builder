import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class ApproveStoreUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  async execute(storeId: string, actorUserId: string) {
    const store = await this.adminRepo.findStoreById(storeId);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    if (store.status !== 'PENDING_REVIEW' && store.status !== 'DRAFT') {
      throw new DomainException(
        ErrorCode.STORE_INVALID_TRANSITION,
        'Store cannot be approved from current status',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.adminRepo.approveAndPublishStore(storeId);

    // INV-A01
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'STORE_APPROVED',
      entityType: 'Store',
      entityId: storeId,
      payload: { adminId: actorUserId },
    });

    return updated;
  }
}
