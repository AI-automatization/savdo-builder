import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class UnsuspendUserUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  // INV-A01: AuditLog is mandatory for every admin action.
  async execute(targetUserId: string, actorUserId: string, reason: string) {
    const user = await this.adminRepo.findUserById(targetUserId);
    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    if (user.status === 'ACTIVE') {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'User is not suspended',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.adminRepo.setUserStatus(targetUserId, 'ACTIVE');

    // INV-A01
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'USER_UNSUSPENDED',
      entityType: 'User',
      entityId: targetUserId,
      payload: { reason, adminId: actorUserId },
    });

    return updated;
  }
}
