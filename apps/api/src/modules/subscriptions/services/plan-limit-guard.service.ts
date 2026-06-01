import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ProductStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PLAN_CONFIG } from '../plan-config';

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
 * Использование:
 *   await this.planLimitGuard.enforceProductsLimit(sellerId); // в CreateProductUseCase
 *   await this.planLimitGuard.enforceFeature(sellerId, 'abandoned_carts');
 *   const state = await this.planLimitGuard.canPlaceOrder(sellerId); // soft check для buyer flow
 */
@Injectable()
export class PlanLimitGuardService {
  private readonly logger = new Logger(PlanLimitGuardService.name);

  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Хард-блок: проверяет лимит активных товаров перед созданием нового.
   * Бросает 402 PAYMENT_REQUIRED при достижении лимита.
   * Бросает SUBSCRIPTION_SUSPENDED при SUSPENDED/CANCELLED/CHURNED статусах.
   */
  async enforceProductsLimit(sellerId: string): Promise<void> {
    const subscription = await this.subscriptionsRepo.findBySellerId(sellerId);
    if (!subscription) {
      // У существующих seller'ов без подписки — GetCurrentSubscriptionUseCase auto-стартует TRIAL.
      // Если сюда добрались без подписки — это inconsistency: блокируем чтобы избежать обхода.
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Активная подписка не найдена. Откройте раздел "Тариф" чтобы активировать триал.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    this.assertSubscriptionActive(subscription.status);

    const limit = PLAN_CONFIG[subscription.tier].productsLimit;
    // null = безлимит (PRO / BUSINESS) — пропускаем без подсчёта.
    if (limit === null) return;

    const current = await this.countActiveProductsBySeller(sellerId);
    if (current >= limit) {
      throw new DomainException(
        ErrorCode.PLAN_LIMIT_EXCEEDED,
        `Достигнут лимит товаров: ${current}/${limit} на тарифе ${subscription.tier}. Обновите план чтобы добавить больше.`,
        HttpStatus.PAYMENT_REQUIRED,
        {
          current,
          limit,
          tier: subscription.tier,
          resource: 'products',
        },
      );
    }
  }

  /**
   * Хард-блок: проверяет доступность фичи на текущем тарифе.
   * Бросает 402 PAYMENT_REQUIRED если фичи нет в features[] текущего тарифа.
   * Бросает SUBSCRIPTION_SUSPENDED при SUSPENDED/CANCELLED/CHURNED.
   */
  async enforceFeature(sellerId: string, feature: string): Promise<void> {
    const subscription = await this.subscriptionsRepo.findBySellerId(sellerId);
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
        {
          feature,
          tier: subscription.tier,
          availableFeatures: features,
        },
      );
    }
  }

  /**
   * Софт-чек заказов в текущем календарном месяце (business-model-v2 §5).
   * НЕ блокирует — только возвращает state для отображения баннера в seller dashboard.
   *
   * Buyer flow не должен ломаться от лимита продавца. allowed=false означает:
   * "seller достиг лимита, баннер показать, но заказ всё равно создаём".
   */
  async canPlaceOrder(
    sellerId: string,
  ): Promise<{ allowed: boolean; currentMonthOrders: number; limit: number | null }> {
    const subscription = await this.subscriptionsRepo.findBySellerId(sellerId);
    if (!subscription) {
      // Нет подписки — нечего считать. Buyer flow продолжается.
      return { allowed: true, currentMonthOrders: 0, limit: null };
    }

    const limit = PLAN_CONFIG[subscription.tier].ordersLimitPerMonth;
    const currentMonthOrders = await this.countOrdersThisMonth(sellerId);

    // null = безлимит → всегда allowed.
    if (limit === null) {
      return { allowed: true, currentMonthOrders, limit: null };
    }

    return {
      allowed: currentMonthOrders < limit,
      currentMonthOrders,
      limit,
    };
  }

  // ─── internal helpers ──────────────────────────────────────────────────────

  /**
   * Кидает SUBSCRIPTION_SUSPENDED для статусов, при которых seller не может выполнять write-операции.
   * TRIAL / ACTIVE / PAST_DUE — write разрешены (PAST_DUE в grace-периоде сохраняет доступ).
   */
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

  /**
   * Считает активные товары (status=ACTIVE, deletedAt=null) по ВСЕМ магазинам seller'а.
   * В MVP один-к-одному (INV-S01: один seller = один store), но фильтр через сeller.id
   * сделан вперёд — на случай мульти-store фазы.
   */
  private async countActiveProductsBySeller(sellerId: string): Promise<number> {
    return this.prisma.product.count({
      where: {
        store: { sellerId },
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }

  /**
   * Считает заказы seller'а в текущем календарном месяце (с 1-го числа 00:00 локального UTC).
   */
  private async countOrdersThisMonth(sellerId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    return this.prisma.order.count({
      where: {
        sellerId,
        createdAt: { gte: monthStart },
      },
    });
  }
}
