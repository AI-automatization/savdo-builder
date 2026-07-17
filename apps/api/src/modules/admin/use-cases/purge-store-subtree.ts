import { Prisma } from '@prisma/client';

/**
 * ADMIN-STORE-PURGE-001: общий хелпер безвозвратного удаления поддерева магазина.
 * Используется двумя use-case'ами: AdminPurgeUserUseCase (purge аккаунта вместе
 * с магазином) и AdminPurgeStoreUseCase (purge только магазина — например,
 * тестовый магазин на admin-аккаунте, который сам purge-нуть нельзя).
 *
 * Порядок повторяет FK-карту схемы: Restrict-связи чистятся вручную,
 * Cascade/SetNull делают своё. Вызывать ТОЛЬКО внутри $transaction.
 */
export async function purgeStoreSubtree(
  tx: Prisma.TransactionClient,
  storeId: string,
  sellerId: string,
): Promise<{ orders: number; products: number }> {
  // ChatThread.productId/orderId — FK без onDelete (NO ACTION ≈ Restrict):
  // тред по товару/заказу магазина заблокирует product/order.deleteMany (P2003).
  // INV-S01 (один seller = один store) ⇒ все треды продавца относятся к этому
  // магазину — удаляем по sellerId (messages → threads).
  await tx.chatMessage.deleteMany({ where: { thread: { sellerId } } });
  await tx.chatThread.deleteMany({ where: { sellerId } });

  // ModerationCase/Action держат entityId строкой БЕЗ FK — каскады их не
  // зацепят. Без ручной чистки в очереди модерации остаются сироты, а
  // APPROVE/REJECT по ним падает P2025 (update несуществующего store).
  const productIds = (
    await tx.product.findMany({ where: { storeId }, select: { id: true } })
  ).map((p) => p.id);
  const moderationEntityIds = [storeId, ...productIds];
  await tx.moderationAction.deleteMany({ where: { entityId: { in: moderationEntityIds } } });
  await tx.moderationCase.deleteMany({ where: { entityId: { in: moderationEntityIds } } });

  // Заказы магазина: history/refunds — Restrict → вручную; items — Cascade.
  await tx.orderStatusHistory.deleteMany({ where: { order: { storeId } } });
  await tx.orderRefund.deleteMany({ where: { order: { storeId } } });
  const orders = (await tx.order.deleteMany({ where: { storeId } })).count;
  // Корзины магазина (CartItem — Cascade через Cart).
  await tx.cart.deleteMany({ where: { storeId } });
  // Товары: Restrict-хвосты (движения склада, вариант-опции, варианты, опции)
  // — вручную; images/attributes/wishlist/reviews — Cascade.
  await tx.inventoryMovement.deleteMany({ where: { product: { storeId } } });
  await tx.productVariantOptionValue.deleteMany({
    where: { variant: { product: { storeId } } },
  });
  await tx.productVariant.deleteMany({ where: { product: { storeId } } });
  await tx.productOptionValue.deleteMany({
    where: { optionGroup: { product: { storeId } } },
  });
  await tx.productOptionGroup.deleteMany({ where: { product: { storeId } } });
  const products = (await tx.product.deleteMany({ where: { storeId } })).count;
  // Store-периферия (Restrict): контакты, доставка, категории, партнёрские ключи.
  await tx.storeContact.deleteMany({ where: { storeId } });
  await tx.storeDeliverySettings.deleteMany({ where: { storeId } });
  await tx.storeCategory.deleteMany({ where: { storeId } });
  await tx.partnerApiKey.deleteMany({ where: { storeId } });
  // StoreDirection — Cascade; AnalyticsEvent.storeId — plain-колонка без FK
  // (schema.prisma: у AnalyticsEvent нет relation на Store) — не блокирует,
  // строки аналитики сохраняют мёртвый storeId. Сам магазин:
  await tx.store.delete({ where: { id: storeId } });

  return { orders, products };
}
