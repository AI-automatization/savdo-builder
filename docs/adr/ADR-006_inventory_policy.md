# ADR-006 — Политика списания stock при заказе

**Дата:** 2026-03-21
**Статус:** Accepted

## Контекст

Нужно определить: когда списывается stock? При создании заказа или при его подтверждении seller-ом?

Варианты:
1. **Immediate deduction** — stock списывается при `order.status = PENDING`
2. **Deduction on confirm** — stock списывается при `order.status = CONFIRMED`
3. **Reservation model** — stock резервируется при PENDING, окончательно списывается при CONFIRMED

## Решение

**Немедленное списание при создании заказа (Immediate Deduction).**

- `order created (PENDING)` → stock `-= quantity` немедленно в той же транзакции
- `order cancelled (любой статус)` → stock `+= quantity` немедленно
- Нет резервирования, нет "мягкого" списания

## Причины

1. **Простота.** Нет отдельной reserved_quantity. Один счётчик — `stock_quantity`.
2. **Защита от overselling.** Если stock = 1 и два покупателя одновременно — первый получает заказ, второй получает `INSUFFICIENT_STOCK`. Нет двойных продаж.
3. **Соответствие ожиданиям.** Seller видит реальный остаток сразу.
4. **Для UZ рынка это нормально.** COD + маленькие объёмы = простая модель достаточна.

## Последствия

- **Неотработанные заказы занимают stock.** Если seller не отвечает, stock "заморожен". Решение: автоматическая отмена PENDING заказов через 48 часов (cron job).
- **Покупатель может "потерять" товар** между добавлением в корзину и оформлением. Это нормально — stock не резервируется при добавлении в корзину.
- Overselling невозможен технически — проверка на `stock_quantity >= quantity` в той же транзакции что и списание.

## Реализация

```typescript
// В CreateOrderService (в одной транзакции)
await this.tx.run(async (db) => {
  // 1. Validate stock
  for (const item of cartItems) {
    const variant = await db.productVariant.findUnique({ where: { id: item.variantId } });
    if (variant.stockQuantity < item.quantity) {
      throw new InsufficientStockError(item.variantId, variant.stockQuantity, item.quantity);
    }
  }

  // 2. Deduct stock
  for (const item of cartItems) {
    await db.productVariant.update({
      where: { id: item.variantId },
      data: { stockQuantity: { decrement: item.quantity } },
    });
    await db.inventoryMovements.create({
      data: {
        variantId: item.variantId,
        movementType: 'ORDER_DEDUCTED',
        quantityDelta: -item.quantity,
        referenceType: 'order',
        referenceId: order.id,
      },
    });
  }

  // 3. Create order + order_items + status_history
  // ...
});
```

## Auto-cancellation policy

PENDING заказы старше **48 часов** автоматически отменяются:
- BullMQ repeatable job: каждый час проверяет PENDING заказы > 48ч
- При отмене: stock восстанавливается, buyer получает уведомление
- Seller получает уведомление о том что заказ отменён автоматически

Это можно настроить через env: `AUTO_CANCEL_PENDING_AFTER_HOURS=48`
