import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ProductStatus, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { DomainException } from '../common/exceptions/domain.exception';
import { ErrorCode } from './constants/error-codes';
import { PLAN_CONFIG } from '../modules/subscriptions/plan-config';

/**
 * PlanLimitGuardService — единый guard для проверки лимитов тарифа подписки.
 *
 * Покрывает хард-гейты (BILLING-MACHINE-001 / business-model-v2 §5):
 *  - products limit (хард-блок при достижении лимита тарифа)
 *  - feature-flags (хард-блок если фича недоступна на текущем тарифе)
 *  - subscription status — SUSPENDED/CANCELLED/CHURNED блокируют действия seller'a
 *
 * Софт-гейт (только баннер, без блока): orders-limit-per-month через canPlaceOrder().
 *
 * АРХИТЕКТУРА: сервис живёт в `shared/`, инжектит только глобальный PrismaService —
 * без зависимости от SubscriptionsModule. Это убирает циклическую зависимость
 * AdminModule → ProductsModule → SubscriptionsModule → AdminModule, которая возникала
 * раньше когда сервис был внутри SubscriptionsModule (2026-06-01 prod-crash fix).
 *
 * Использование:
 *   await this.planLimitGuard.enforceProductsLimit(sellerId); // в CreateProductUseCase
 *   await this.planLimitGuard.enforceFeature(sellerId, 'abandoned_carts');
 *   const state = await this.planLimitGuard.canPlaceOrder(sellerId); // soft check для buyer flow
 */
@Injectable()
export class PlanLimitGuardService {
  private readonly logger = new Logger(PlanLimitGuardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Хард-блок: проверяет лимит активных товаров перед созданием нового.
   * Бросает 402 PAYMENT_REQUIRED при достижении лимита.
   * Бросает SUBSCRIPTION_SUSPENDED при SUSPENDED/CANCELLED/CHURNED статусах.
   */
  async enforceProductsLimit(sellerId: string): Promise<void> {
    const subscription = await this.findSubscription(sellerId);
    if (!subscription) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Активная подписка не найдена. Откройте раздел "Тариф" чтобы активировать триал.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    this.assertSubscriptionActive(subscription.status);

    const limit = PLAN_CONFIG[subscription.tier].productsLimit;
    if (limit === null) return; // null = безлимит (PRO / BUSINESS)

    const current = await this.countActiveProductsBySeller(sellerId);
    if (current >= limit) {
      throw new DomainException(
        ErrorCode.PLAN_LIMIT_EXCEEDED,
        `Достигнут лимит товаров: ${current}/${limit} на тарифе ${subscription.tier}. Обновите план чтобы добавить больше.`,
        HttpStatus.PAYMENT_REQUIRED,
        { current, limit, tier: subscription.tier, resource: 'products' },
      );
    }
  }

  /**
   * Хард-блок: проверяет доступность фичи на текущем тарифе.
   */
  async enforceFeature(sellerId: string, feature: string): Promise<void> {
    const subscription = await this.findSubscription(sellerId);
    if (!subscription) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Активная подписка не найдена.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    this.assertSubscriptionActive(subscription.status);

    const features = PLAN_CONFIG[subscription.tier].features;
    if (!features.includes(feature)) {
      throw new DomainException(
        ErrorCode.PLAN_LIMIT_EXCEEDED,
        `Функция "${feature}" недоступна на тарифе ${subscription.tier}. Обновите план чтобы получить доступ.`,
        HttpStatus.PAYMENT_REQUIRED,
        { feature, tier: subscription.tier, availableFeatures: features },
      );
    }
  }

  /**
   * Софт-чек заказов в текущем календарном месяце (business-model-v2 §5).
   * НЕ блокирует — только возвращает state для баннера в seller dashboard.
   */
  async canPlaceOrder(
    sellerId: string,
  ): Promise<{ allowed: boolean; currentMonthOrders: number; limit: number | null }> {
    const subscription = await this.findSubscription(sellerId);
    if (!subscription) {
      return { allowed: true, currentMonthOrders: 0, limit: null };
    }

    const limit = PLAN_CONFIG[subscription.tier].ordersLimitPerMonth;
    const currentMonthOrders = await this.countOrdersThisMonth(sellerId);

    if (limit === null) {
      return { allowed: true, currentMonthOrders, limit: null };
    }
    return { allowed: currentMonthOrders < limit, currentMonthOrders, limit };
  }

  // ─── internal helpers ──────────────────────────────────────────────────────

  /** Прямой Prisma вызов без SubscriptionsRepository — убирает зависимость от SubscriptionsModule. */
  private async findSubscription(
    sellerId: string,
  ): Promise<{ tier: SubscriptionTier; status: SubscriptionStatus } | null> {
    return this.prisma.subscription.findUnique({
      where: { sellerId },
      select: { tier: true, status: true },
    });
  }

  private assertSubscriptionActive(status: SubscriptionStatus): void {
    if (
      status === SubscriptionStatus.SUSPENDED ||
      status === SubscriptionStatus.CANCELLED ||
      status === SubscriptionStatus.CHURNED
    ) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_SUSPENDED,
        'Подписка приостановлена. Оплатите тариф чтобы продолжить работу.',
        HttpStatus.PAYMENT_REQUIRED,
        { status },
      );
    }
  }

  private async countActiveProductsBySeller(sellerId: string): Promise<number> {
    return this.prisma.product.count({
      where: {
        store: { sellerId },
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }

  private async countOrdersThisMonth(sellerId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    return this.prisma.order.count({
      where: { sellerId, createdAt: { gte: monthStart } },
    });
  }
}
