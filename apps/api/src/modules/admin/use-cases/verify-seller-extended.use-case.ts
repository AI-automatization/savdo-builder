import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const VALID_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'] as const;
export type VerificationStatus = typeof VALID_STATUSES[number];

interface VerifyInput {
  adminUserId: string;       // User.id админа (для audit)
  sellerId: string;
  status: VerificationStatus;
  reason?: string;           // обязательно для REJECTED/SUSPENDED
  notes?: string;            // внутренние заметки
  checkedRequirements?: string[]; // ['docs_uploaded', 'tg_linked', 'contacts_valid', ...]
}

@Injectable()
export class VerifySellerExtendedUseCase {
  private readonly logger = new Logger(VerifySellerExtendedUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(input: VerifyInput) {
    if (!VALID_STATUSES.includes(input.status)) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if ((input.status === 'REJECTED' || input.status === 'SUSPENDED') && !input.reason?.trim()) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Reason is required for ${input.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const seller = await this.prisma.seller.findUnique({
      where: { id: input.sellerId },
      select: { id: true, userId: true, verificationStatus: true, fullName: true },
    });
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.seller.update({
      where: { id: input.sellerId },
      data: {
        verificationStatus: input.status as any,
        // SUSPENDED → блокируем продавца, его магазин невидим
        ...(input.status === 'SUSPENDED' && {
          isBlocked: true,
          blockedReason: input.reason ?? 'Suspended by admin',
        }),
        // VERIFIED → разблокируем
        ...(input.status === 'VERIFIED' && { isBlocked: false, blockedReason: null }),
      },
    });

    // Audit log с полным контекстом (reason, notes, checkedRequirements)
    await this.prisma.auditLog.create({
      data: {
        actorUserId: input.adminUserId,
        actorType: 'admin',
        action: `seller.verification.${input.status.toLowerCase()}`,
        entityType: 'seller',
        entityId: input.sellerId,
        payload: {
          previousStatus: seller.verificationStatus,
          newStatus: input.status,
          reason: input.reason ?? null,
          notes: input.notes ?? null,
          checkedRequirements: input.checkedRequirements ?? [],
          sellerName: seller.fullName,
        },
      },
    }).catch((err: unknown) => {
      // Не падаем если audit недоступен (БД unavailable)
      this.logger.warn(`Audit log write failed: ${err instanceof Error ? err.message : String(err)}`);
    });

    this.logger.log(`Seller ${input.sellerId} verification → ${input.status} by admin user ${input.adminUserId}`);

    return {
      id: updated.id,
      verificationStatus: updated.verificationStatus,
      isBlocked: updated.isBlocked,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      checkedRequirements: input.checkedRequirements ?? [],
    };
  }
}
