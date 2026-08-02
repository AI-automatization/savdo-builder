import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { purgeStoreSubtree } from './purge-store-subtree';

/**
 * ADMIN-STORE-PURGE-001: безвозвратное удаление МАГАЗИНА (без аккаунта владельца).
 * Нужен для чистки тестовых магазинов, висящих на admin-аккаунтах: сам аккаунт
 * purge-нуть нельзя (AdminUser-guard в AdminPurgeUserUseCase), а его магазин —
 * можно. Seller-профиль владельца остаётся (store у него станет null — INV-S01
 * допускает продавца без магазина до онбординга).
 *
 * Защита: type-to-confirm — confirmSlug должен совпасть со slug магазина.
 */
@Injectable()
export class AdminPurgeStoreUseCase {
  private readonly logger = new Logger(AdminPurgeStoreUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(input: { storeId: string; actorUserId: string; confirmSlug: string }) {
    const { storeId, actorUserId, confirmSlug } = input;

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, slug: true, name: true, sellerId: true },
    });
    if (!store) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    if (confirmSlug !== store.slug) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'confirmSlug does not match the store slug',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let deleted = { orders: 0, products: 0 };
    await this.prisma.$transaction(async (tx) => {
      deleted = await purgeStoreSubtree(tx, storeId, store.sellerId);

      // Append-only след (INV-A01).
      await tx.auditLog.create({
        data: {
          actorUserId,
          actorType: 'admin',
          entityType: 'Store',
          entityId: storeId,
          action: 'STORE_HARD_DELETED',
          payload: {
            reason: 'ADMIN_PURGE',
            slug: store.slug,
            name: store.name,
            sellerId: store.sellerId,
            deletedOrders: deleted.orders,
            deletedProducts: deleted.products,
            executedAt: new Date().toISOString(),
          },
        },
      });
    });

    this.logger.warn(
      `ADMIN PURGE store=${storeId} (${store.slug}) by admin=${actorUserId}: ` +
        `orders=${deleted.orders}, products=${deleted.products}`,
    );

    return { storeId, slug: store.slug, purged: true, ...deleted };
  }
}
