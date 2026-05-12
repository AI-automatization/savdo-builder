import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * MARKETING-VERIFIED-SELLER-001: admin вручную ставит/снимает галочку
 * «Verified» на магазине. Это trust-signal для покупателей на storefront
 * (отдельный значок рядом с названием магазина).
 *
 * INV-A01: audit_log обязателен.
 * INV-A02: reason нужен только при unverify (объяснение почему сняли).
 */
@Injectable()
export class SetStoreVerificationUseCase {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: {
    storeId: string;
    actorUserId: string;
    isVerified: boolean;
    reason?: string;
  }): Promise<{ id: string; isVerified: boolean }> {
    const store = await this.adminRepo.findStoreById(input.storeId);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    const wasVerified = (store as { isVerified?: boolean }).isVerified ?? false;
    if (wasVerified === input.isVerified) {
      // Не считаем ошибкой — идемпотентность. Возвращаем как есть.
      return { id: store.id, isVerified: wasVerified };
    }

    if (!input.isVerified && !input.reason?.trim()) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Reason is required when removing verification',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.store.update({
      where: { id: input.storeId },
      data: { isVerified: input.isVerified },
      select: { id: true, isVerified: true },
    });

    await this.adminRepo.writeAuditLog({
      actorUserId: input.actorUserId,
      action: input.isVerified ? 'STORE_VERIFIED' : 'STORE_UNVERIFIED',
      entityType: 'Store',
      entityId: input.storeId,
      payload: {
        reason: input.reason ?? null,
        adminId: input.actorUserId,
        previousIsVerified: wasVerified,
      },
    });

    return updated;
  }
}
