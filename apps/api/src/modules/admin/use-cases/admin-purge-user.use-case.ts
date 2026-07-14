import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * ADMIN-USER-PURGE-001: безвозвратное удаление аккаунта из админки —
 * вместе с seller-профилем, магазином, товарами, заказами и чатами.
 * Назначение: чистка тестовых аккаунтов перед выдачей в эксплуатацию.
 *
 * Отличие от PurgeDeletedUsersProcessor (cron T+90d): тот НАМЕРЕННО пропускает
 * юзеров с seller-записью; этот use-case — ручной admin-инструмент, который
 * удаляет всё дерево. PrismaService напрямую (не через репозитории) — тот же
 * прецедент, что и purge-processor: каскад на ~15 моделей, это data-lifecycle
 * операция, а не доменная логика.
 *
 * Порядок удаления повторяет FK-карту схемы (RESTRICT-связи чистятся вручную,
 * Cascade/SetNull делают своё): см. комментарии по шагам.
 *
 * Защиты:
 *  - нельзя удалить самого себя;
 *  - нельзя удалить аккаунт с AdminUser-записью (сначала revoke в super-admin);
 *  - подтверждение: confirmPhone должен совпасть с phone удаляемого юзера.
 */
@Injectable()
export class AdminPurgeUserUseCase {
  private readonly logger = new Logger(AdminPurgeUserUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(input: { userId: string; actorUserId: string; confirmPhone: string }) {
    const { userId, actorUserId, confirmPhone } = input;

    if (userId === actorUserId) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Cannot purge your own account',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        admin: { select: { id: true } },
        buyer: { select: { id: true } },
        seller: { select: { id: true, store: { select: { id: true, slug: true } } } },
      },
    });
    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }
    if (user.admin) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'User has an AdminUser record — revoke admin access first (super-admin panel)',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    // Type-to-confirm: защита от «не туда нажал» на безвозвратной операции.
    if (confirmPhone !== user.phone) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'confirmPhone does not match the account phone',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const sellerId = user.seller?.id ?? null;
    const storeId = user.seller?.store?.id ?? null;
    const buyerId = user.buyer?.id ?? null;

    const deleted = { orders: 0, products: 0, store: !!storeId };

    await this.prisma.$transaction(async (tx) => {
      // ── SELLER-ветка ────────────────────────────────────────────────────
      if (sellerId) {
        // ChatThread.sellerId REQUIRED (Restrict) → сообщения, потом треды.
        await tx.chatMessage.deleteMany({ where: { thread: { sellerId } } });
        await tx.chatThread.deleteMany({ where: { sellerId } });

        if (storeId) {
          // Заказы магазина: history/refunds — Restrict → вручную; items — Cascade.
          await tx.orderStatusHistory.deleteMany({ where: { order: { storeId } } });
          await tx.orderRefund.deleteMany({ where: { order: { storeId } } });
          deleted.orders = (await tx.order.deleteMany({ where: { storeId } })).count;
          // Корзины магазина (CartItem — Cascade через Cart).
          await tx.cart.deleteMany({ where: { storeId } });
          // Товары: Restrict-хвосты (движения склада, вариант-опции, варианты,
          // опции) — вручную; images/attributes/wishlist/reviews — Cascade.
          await tx.inventoryMovement.deleteMany({ where: { product: { storeId } } });
          await tx.productVariantOptionValue.deleteMany({
            where: { variant: { product: { storeId } } },
          });
          await tx.productVariant.deleteMany({ where: { product: { storeId } } });
          await tx.productOptionValue.deleteMany({
            where: { optionGroup: { product: { storeId } } },
          });
          await tx.productOptionGroup.deleteMany({ where: { product: { storeId } } });
          deleted.products = (await tx.product.deleteMany({ where: { storeId } })).count;
          // Store-периферия (Restrict): контакты, доставка, категории, партнёрские ключи.
          await tx.storeContact.deleteMany({ where: { storeId } });
          await tx.storeDeliverySettings.deleteMany({ where: { storeId } });
          await tx.storeCategory.deleteMany({ where: { storeId } });
          await tx.partnerApiKey.deleteMany({ where: { storeId } });
          // StoreDirection — Cascade. Сам магазин:
          await tx.store.delete({ where: { id: storeId } });
        }

        // Подписка (payments — Restrict) и документы верификации.
        await tx.subscriptionPayment.deleteMany({ where: { subscription: { sellerId } } });
        await tx.subscription.deleteMany({ where: { sellerId } });
        await tx.sellerVerificationDocument.deleteMany({ where: { sellerId } });
        await tx.seller.delete({ where: { id: sellerId } });
      }

      // ── BUYER + USER ветка (зеркало purge-processor'а) ──────────────────
      // Restrict-FK: AuditLog.actorUserId и SubscriptionPayment.confirmedByUserId
      // → NULL (истории сохраняются анонимизированными).
      await tx.auditLog.updateMany({
        where: { actorUserId: userId },
        data: { actorUserId: null },
      });
      await tx.subscriptionPayment.updateMany({
        where: { confirmedByUserId: userId },
        data: { confirmedByUserId: null },
      });
      if (buyerId) {
        // Заказы юзера-как-покупателя в ЧУЖИХ магазинах не удаляем — только
        // отвязываем (customerPhone/FullName денормализованы, финансы целы).
        await tx.order.updateMany({ where: { buyerId }, data: { buyerId: null } });
        await tx.buyer.delete({ where: { id: buyerId } });
      }
      await tx.user.delete({ where: { id: userId } });

      // Append-only след (INV-A01). Actor — админ-инициатор.
      await tx.auditLog.create({
        data: {
          actorUserId: actorUserId,
          actorType: 'admin',
          entityType: 'User',
          entityId: userId,
          action: 'USER_HARD_DELETED',
          payload: {
            reason: 'ADMIN_PURGE',
            phoneTail: user.phone.slice(-4),
            hadSeller: !!sellerId,
            storeSlug: user.seller?.store?.slug ?? null,
            deletedOrders: deleted.orders,
            deletedProducts: deleted.products,
            executedAt: new Date().toISOString(),
          },
        },
      });
    });

    this.logger.warn(
      `ADMIN PURGE user=${userId} by admin=${actorUserId}: store=${storeId ?? '-'}, ` +
        `orders=${deleted.orders}, products=${deleted.products}`,
    );

    return { userId, purged: true, ...deleted };
  }
}
