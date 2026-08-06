import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * ADMIN-STORE-VISIBILITY-001: admin скрывает/показывает магазин на
 * storefront напрямую, без участия продавца (seller-only `POST /stores/publish`
 * /`unpublish` требует JWT владельца — не годится для служебных магазинов вроде
 * технического RAOS-pilot стора, у которого нет реального владельца в TMA/web-seller).
 *
 * Использует то же поле `Store.isPublic`, что и storefront-фильтры
 * (products.repository.ts, stores.repository.ts, storefront.controller.ts) —
 * отдельного "скрытого" статуса не вводим, чтобы не плодить второй источник правды.
 *
 * INV-A01: audit_log обязателен.
 */
@Injectable()
export class SetStoreVisibilityUseCase {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: {
    storeId: string;
    actorUserId: string;
    isPublic: boolean;
    reason?: string;
  }): Promise<{ id: string; isPublic: boolean }> {
    const store = await this.adminRepo.findStoreById(input.storeId);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    const wasPublic = (store as { isPublic?: boolean }).isPublic ?? false;
    if (wasPublic === input.isPublic) {
      // Идемпотентность — не ошибка, просто возвращаем текущее состояние.
      return { id: store.id, isPublic: wasPublic };
    }

    const updated = await this.prisma.store.update({
      where: { id: input.storeId },
      data: { isPublic: input.isPublic },
      select: { id: true, isPublic: true },
    });

    await this.adminRepo.writeAuditLog({
      actorUserId: input.actorUserId,
      action: input.isPublic ? 'STORE_SHOWN' : 'STORE_HIDDEN',
      entityType: 'Store',
      entityId: input.storeId,
      payload: {
        reason: input.reason ?? null,
        adminId: input.actorUserId,
        previousIsPublic: wasPublic,
      },
    });

    return updated;
  }
}
