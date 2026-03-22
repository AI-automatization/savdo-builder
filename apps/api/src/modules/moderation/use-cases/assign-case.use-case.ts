import { Injectable, HttpStatus } from '@nestjs/common';
import { ModerationRepository } from '../repositories/moderation.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AssignCaseUseCase {
  constructor(
    private readonly moderationRepo: ModerationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(caseId: string, adminUserId: string) {
    // Resolve AdminUser.id from userId (JWT sub)
    const adminUser = await this.moderationRepo.findAdminByUserId(adminUserId);
    if (!adminUser) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Admin profile not found',
        HttpStatus.FORBIDDEN,
      );
    }

    const moderationCase = await this.moderationRepo.findCaseById(caseId);
    if (!moderationCase) {
      throw new DomainException(
        ErrorCode.MODERATION_CASE_NOT_FOUND,
        'Moderation case not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.moderationCase.update({
        where: { id: moderationCase.id },
        data: { assignedAdminId: adminUser.id },
      });

      await tx.moderationAction.create({
        data: {
          caseId: moderationCase.id,
          entityType: moderationCase.entityType,
          entityId: moderationCase.entityId,
          adminUserId: adminUser.id,
          actionType: 'ASSIGN',
          comment: null,
        },
      });

      // INV-A01: write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorType: 'admin',
          entityType: 'moderation_case',
          entityId: moderationCase.id,
          action: 'moderation.assign',
          payload: {
            caseId: moderationCase.id,
            assignedAdminId: adminUser.id,
          },
        },
      });
    });

    return this.moderationRepo.findCaseById(caseId);
  }
}
