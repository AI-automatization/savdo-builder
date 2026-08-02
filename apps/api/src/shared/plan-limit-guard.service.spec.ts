/**
 * Тесты для `PlanLimitGuardService.assertActiveSubscription` (SUSPENDED-ENFORCEMENT-001).
 *
 * Контекст: до фикса статус подписки проверялся только в enforceProductsLimit()
 * (создание товара). Приостановленный продавец мог редактировать каталог,
 * варианты, фото, слать репосты в TG-канал — все mutation-роутов проходили на 200.
 * Этот гейт теперь дёргается из ProductsController.resolveStoreId() на всех
 * seller-мутациях.
 *
 * Покрытие:
 *   - SUSPENDED / CANCELLED / CHURNED → 402 SUBSCRIPTION_SUSPENDED (блок);
 *   - TRIAL / ACTIVE / PAST_DUE → проходит (grace-период всё ещё рабочий);
 *   - подписки нет (data-gap) → fail-open (не блокируем валидного продавца).
 */
import { HttpStatus } from '@nestjs/common';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PlanLimitGuardService } from './plan-limit-guard.service';
import { DomainException } from '../common/exceptions/domain.exception';
import { ErrorCode } from './constants/error-codes';

const SELLER_ID = 'seller-1';

function makeService(subscription: { status: SubscriptionStatus; tier: SubscriptionTier } | null) {
  const prisma = {
    subscription: {
      findUnique: jest.fn().mockResolvedValue(subscription),
    },
  };
  // Приводим к минимально нужной форме — сервис использует только subscription.findUnique.
  const service = new PlanLimitGuardService(prisma as never);
  return { service, prisma };
}

describe('PlanLimitGuardService.assertActiveSubscription (SUSPENDED-ENFORCEMENT-001)', () => {
  const BLOCKED: SubscriptionStatus[] = [
    SubscriptionStatus.SUSPENDED,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.CHURNED,
  ];

  it.each(BLOCKED)('бросает 402 SUBSCRIPTION_SUSPENDED при статусе %s', async (status) => {
    const { service } = makeService({ status, tier: SubscriptionTier.FREE });
    await expect(service.assertActiveSubscription(SELLER_ID)).rejects.toMatchObject({
      code: ErrorCode.SUBSCRIPTION_SUSPENDED,
      status: HttpStatus.PAYMENT_REQUIRED,
    });
  });

  const ALLOWED: SubscriptionStatus[] = [
    SubscriptionStatus.TRIAL,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
  ];

  it.each(ALLOWED)('пропускает при рабочем статусе %s', async (status) => {
    const { service } = makeService({ status, tier: SubscriptionTier.FREE });
    await expect(service.assertActiveSubscription(SELLER_ID)).resolves.toBeUndefined();
  });

  it('fail-open: подписки нет (data-gap) → не блокирует', async () => {
    const { service, prisma } = makeService(null);
    await expect(service.assertActiveSubscription(SELLER_ID)).resolves.toBeUndefined();
    expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
      where: { sellerId: SELLER_ID },
      select: { tier: true, status: true },
    });
  });

  it('пробрасывает DomainException (не generic Error) для корректного HTTP-ответа', async () => {
    const { service } = makeService({
      status: SubscriptionStatus.SUSPENDED,
      tier: SubscriptionTier.FREE,
    });
    await expect(service.assertActiveSubscription(SELLER_ID)).rejects.toBeInstanceOf(DomainException);
  });
});
