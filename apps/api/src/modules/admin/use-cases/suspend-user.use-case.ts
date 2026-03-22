import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class SuspendUserUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  // INV-A01: AuditLog is mandatory for every admin action.
  // INV-A02: Suspension requires a reason (enforced by AdminActionDto).
  async execute(targetUserId: string, actorUserId: string, reason: string) {
    const user = await this.adminRepo.findUserById(targetUserId);
    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    if (user.status === 'BLOCKED') {
      throw new DomainException(
        ErrorCode.ADMIN_USER_ALREADY_SUSPENDED,
        'User is already suspended',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.adminRepo.setUserStatus(targetUserId, 'BLOCKED');

    // INV-A01
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: targetUserId,
      payload: { reason, adminId: actorUserId },
    });

    return updated;
  }
}
