import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ModerationRepository } from '../repositories/moderation.repository';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PrismaService } from '../../../database/prisma.service';
import { TakeActionDto } from '../dto/take-action.dto';

// Maps moderation action to the resulting case status (null = no change)
const ACTION_TO_CASE_STATUS: Record<string, string | null> = {
  APPROVE: 'approved',
  REJECT: 'rejected',
  ESCALATE: 'escalated',
  REQUEST_CHANGES: null,
};

@Injectable()
export class TakeActionUseCase {
  private readonly logger = new Logger(TakeActionUseCase.name);

  constructor(
    private readonly moderationRepo: ModerationRepository,
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    caseId: string,
    adminUserId: string,
    dto: TakeActionDto,
  ) {
    // Load the AdminUser profile to get AdminUser.id for FK relations
    const adminUser = await this.moderationRepo.findAdminByUserId(adminUserId);
    if (!adminUser) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Admin profile not found',
        HttpStatus.FORBIDDEN,
      );
    }

    // Load case
    const moderationCase = await this.moderationRepo.findCaseById(caseId);
    if (!moderationCase) {
      throw new DomainException(
        ErrorCode.MODERATION_CASE_NOT_FOUND,
        'Moderation case not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // INV-A02: rejection requires a comment
    if (dto.action === 'REJECT' && !dto.comment?.trim()) {
      throw new DomainException(
        ErrorCode.MODERATION_COMMENT_REQUIRED,
        'A comment is required when rejecting',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newCaseStatus = ACTION_TO_CASE_STATUS[dto.action];

    await this.prisma.$transaction(async (tx) => {
      // Record the moderation action
      await tx.moderationAction.create({
        data: {
          caseId: moderationCase.id,
          entityType: moderationCase.entityType,
          entityId: moderationCase.entityId,
          adminUserId: adminUser.id,
          actionType: dto.action,
          comment: dto.comment,
        },
      });

      // Update case status if the action triggers a transition
      if (newCaseStatus !== null) {
        await tx.moderationCase.update({
          where: { id: moderationCase.id },
          data: { status: newCaseStatus, assignedAdminId: adminUser.id },
        });
      }

      // Apply domain effects based on entity type and action
      if (moderationCase.entityType === 'store') {
        if (dto.action === 'APPROVE') {
          await tx.store.update({
            where: { id: moderationCase.entityId },
            data: { status: 'APPROVED' },
          });
        } else if (dto.action === 'REJECT') {
          await tx.store.update({
            where: { id: moderationCase.entityId },
            data: { status: 'REJECTED' },
          });
        }
      } else if (moderationCase.entityType === 'seller') {
        if (dto.action === 'APPROVE') {
          await tx.seller.update({
            where: { id: moderationCase.entityId },
            data: { verificationStatus: 'VERIFIED' as any },
          });
        } else if (dto.action === 'REJECT') {
          await tx.seller.update({
            where: { id: moderationCase.entityId },
            data: { verificationStatus: 'REJECTED' as any },
          });
        }
      }

      // INV-A01: write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorType: 'admin',
          entityType: 'moderation_case',
          entityId: moderationCase.id,
          action: `moderation.${dto.action.toLowerCase()}`,
          payload: {
            caseId: moderationCase.id,
            subjectType: moderationCase.entityType,
            subjectId: moderationCase.entityId,
            comment: dto.comment ?? null,
          },
        },
      });
    });

    // Return updated case with actions
    return this.moderationRepo.findCaseById(caseId);
  }
}
