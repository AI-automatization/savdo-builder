import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ErrorReporter } from '../../shared/error-reporter';
import { QUEUE_ACCOUNT_DELETION_PURGE } from '../queues.module';

/**
 * PurgeDeletedUsersProcessor — API-ACCOUNT-PURGE-001.
 *
 * Hard-delete пользователей через 90 дней после soft-delete.
 *
 * Контекст:
 *  - Self-service удаление (POST /me/account-deletion/confirm) и
 *    admin DB-manager (db-manager.use-case.ts, ветка 'users') делают **soft**-
 *    delete: deletedAt=NOW(), status=BLOCKED, sessions wiped. Это T=0.
 *  - Спустя 90 дней (политика data-retention + UZ data-minimization) аккаунт
 *    должен быть удалён физически — этот cron выполняет T+90d hard-delete.
 *
 * Расписание: '15 3 * * *' (03:15 UTC = 08:15 Asia/Tashkent).
 *  - 03:15 UTC специально смещено от subscription-expiry-daily (03:00 UTC),
 *    чтобы два суточных батч-cron'а не конкурировали за коннекты Postgres
 *    и таймлайны логов оставались читаемыми.
 *  - UTC выбран намеренно: сервер на Railway всегда UTC, cron не плывёт
 *    от DST/региона деплоя.
 *
 * Подход: `@nestjs/schedule` `@Cron` — НЕ BullMQ repeatable. Зеркалит решение
 * SubscriptionExpiryProcessor (см. соседний файл modules/subscriptions/...):
 *  - Use case идемпотентен (фильтр по deletedAt + status).
 *  - Один раз в сутки, single Railway инстанс → distributed-lock не нужен.
 *  - При горизонтальном масштабировании — мигрируем на BullMQ repeatable
 *    job с stable jobId, используя зарезервированный QUEUE_ACCOUNT_DELETION_PURGE.
 *
 * Безопасность (это МУТИРУЕТ live prod data — paranoia mode):
 *  - Hard-cap batch=50 на тик. Backlog ловится завтра.
 *  - Kill-switch ENV ACCOUNT_PURGE_ENABLED — если не "true", cron логирует
 *    warning и выходит без удаления (для первых деплоев / инцидентов).
 *  - Лог каждого удаляемого user: id + последние 4 цифры phone (PII-safe).
 *  - Per-user $transaction: at-most-one-fails-not-all. P2003 (FK) → пропуск,
 *    Sentry + audit log, продолжаем.
 *
 * FK-стратегия (схема проверена 08.06.2026):
 *  Cascade (auto-delete): UserSession, AccountDeletionOtp, BroadcastLog,
 *    InAppNotification, NotificationPreference, PushSubscription,
 *    NotificationLog, BuyerWishlistItem, BuyerAddress, ChatThread (через Buyer),
 *    ProductReview (через Buyer).
 *  SetNull (auto-NULL): User.referredBy, OrderStatusHistory.changedByUserId,
 *    AnalyticsEvent.actorUserId.
 *  RESTRICT (нужен manual cleanup перед delete user):
 *    - AuditLog.actorUserId — INV-A01 (append-only). Стратегия: set NULL
 *      перед delete; payload/action/entityType остаются immutable. История
 *      действий админа НЕ теряется, теряется только обратная ссылка на user.
 *    - SubscriptionPayment.confirmedByUserId — то же: set NULL (история оплат
 *      сохраняется для финансов).
 *    - Buyer.userId / Seller.userId / AdminUser.userId — 1:1 без onDelete.
 *      Перед удалением user мы explicit-delete-им Buyer/Seller/Admin строку:
 *        - Buyer cascade'ит в Cart/BuyerWishlistItem/BuyerAddress/ProductReview/ChatThread.
 *        - НО Order.buyerId @relation без onDelete → RESTRICT. Перед удалением Buyer
 *          обнуляем Buyer-FK на orders (SetNull вручную) — orderNumber/customerPhone/
 *          customerFullName денормализованы на Order и сохранятся для финансов.
 *        - Seller / AdminUser удалять ОПАСНО (там магазины / модерация). Поэтому
 *          purge SKIPS users с активной seller/admin записью — такие 90-дневно-
 *          удалённые юзеры остаются soft-deleted навсегда (логируется warning).
 *    - ChatMessage.senderUserId — поле String БЕЗ FK relation (см. schema.prisma:1028).
 *      Удаление User не валит FK. Сообщения остаются как исторические записи с
 *      orphan-senderUserId — ок: thread сам по себе принадлежит buyer/seller, а
 *      senderUserId нужен только для UI-метки.
 *
 * Anti-anonymization rationale: НЕ ставим phone='deleted_<id>' / telegramId=null:
 *  - User.phone и .telegramId — UNIQUE. Placeholder'ы рискуют конфликтами.
 *  - GDPR/data-minimization после 90d cool-off → именно delete, не маскировка.
 *  - AuditLog/PriceChangeLog уже сохраняют action+entityId без живого user.
 */
@Injectable()
export class PurgeDeletedUsersProcessor {
  private readonly logger = new Logger(PurgeDeletedUsersProcessor.name);

  /** API-ACCOUNT-PURGE-001: ENV kill-switch для первых деплоев. */
  private static readonly KILL_SWITCH_ENV = 'ACCOUNT_PURGE_ENABLED';

  /** Hard-cap количества удаляемых юзеров за один тик. НЕ повышать без code-review. */
  private static readonly BATCH_SIZE = 50;

  /** 90 дней — политика retention'а (см. self-delete TG-сообщение пользователю). */
  private static readonly RETENTION_DAYS = 90;

  /** Имя cron-job'а — должно быть уникальным во всём ScheduleModule. */
  static readonly CRON_NAME = `${QUEUE_ACCOUNT_DELETION_PURGE}-daily`;

  constructor(private readonly prisma: PrismaService) {}

  @Cron('15 3 * * *', {
    name: PurgeDeletedUsersProcessor.CRON_NAME,
    timeZone: 'UTC',
  })
  async run(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('PurgeDeletedUsers cron started');

    // ── KILL-SWITCH ────────────────────────────────────────────────────────
    // Первые деплои + аварийный disable: если ENV не "true" — НЕ удаляем
    // ничего. Можно крутить cron в проде безопасно, наблюдая логи "would purge=N".
    const enabled = process.env[PurgeDeletedUsersProcessor.KILL_SWITCH_ENV] === 'true';
    if (!enabled) {
      try {
        const dryRunCount = await this.countCandidates(new Date());
        this.logger.warn(
          `PurgeDeletedUsers DISABLED via ${PurgeDeletedUsersProcessor.KILL_SWITCH_ENV}!=true ` +
            `— would purge ${dryRunCount} candidate(s), skipping. ` +
            `Set ${PurgeDeletedUsersProcessor.KILL_SWITCH_ENV}=true in Railway env to enable.`,
        );
      } catch (err) {
        // Даже dry-run счёт упал — не валим cron-runner, просто логируем.
        this.logger.error(
          `PurgeDeletedUsers dry-run count failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return;
    }

    // ── ACTUAL PURGE ───────────────────────────────────────────────────────
    try {
      const stats = await this.executePurge(new Date());
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `PurgeDeletedUsers cron finished in ${durationMs}ms: ` +
          `scanned=${stats.scanned}, purged=${stats.purged}, skipped=${stats.skipped}`,
      );
    } catch (err) {
      // НЕ пробрасываем — иначе @nestjs/schedule может пометить task как
      // failed и в худшем случае не запустит на следующий день. Лучше
      // пропустить итерацию.
      this.logger.error(
        `PurgeDeletedUsers cron failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      ErrorReporter.captureException(err, {
        op: 'purgeDeletedUsers',
        source: 'cron-runner',
      });
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Public for testability — exposed via the spec, called from @Cron above.
  // ────────────────────────────────────────────────────────────────────────

  async countCandidates(now: Date): Promise<number> {
    const threshold = this.thresholdFrom(now);
    return this.prisma.user.count({
      where: {
        deletedAt: { lt: threshold, not: null },
        status: UserStatus.BLOCKED,
      },
    });
  }

  async executePurge(now: Date): Promise<{ scanned: number; purged: number; skipped: number }> {
    const stats = { scanned: 0, purged: 0, skipped: 0 };
    const threshold = this.thresholdFrom(now);

    // Берём батч кандидатов. ORDER BY deletedAt ASC — самые старые первыми,
    // чтобы FIFO-очистка не оставляла «вечно отложенных» юзеров.
    const candidates = await this.prisma.user.findMany({
      where: {
        deletedAt: { lt: threshold, not: null },
        status: UserStatus.BLOCKED,
      },
      orderBy: { deletedAt: 'asc' },
      take: PurgeDeletedUsersProcessor.BATCH_SIZE,
      select: {
        id: true,
        phone: true,
        deletedAt: true,
        seller: { select: { id: true } },
        admin: { select: { id: true } },
        buyer: { select: { id: true } },
      },
    });

    stats.scanned = candidates.length;

    for (const u of candidates) {
      const phoneTail = phoneSuffix4(u.phone);
      const logId = `user=${u.id} phone=***${phoneTail}`;

      // SAFETY: пропускаем юзеров с активной seller/admin записью. Удаление
      // Seller/AdminUser тянет за собой Store/Moderation — это вне scope этого
      // cron'а, нужен отдельный manual review.
      if (u.seller || u.admin) {
        this.logger.warn(
          `PurgeDeletedUsers skipped ${logId}: has ${u.seller ? 'seller' : ''}${u.seller && u.admin ? '+' : ''}${u.admin ? 'admin' : ''} record — manual review required`,
        );
        stats.skipped += 1;
        continue;
      }

      try {
        await this.hardDeleteUserTx(u.id, u.buyer?.id);
        this.logger.log(
          `PurgeDeletedUsers purged ${logId} (soft-deleted at ${u.deletedAt?.toISOString() ?? '<unknown>'})`,
        );
        stats.purged += 1;
      } catch (err) {
        // P2003 FK constraint (или любая другая ошибка delete) — НЕ роняем
        // батч. Логируем, Sentry capture, идём дальше.
        const code = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : 'UNKNOWN';
        this.logger.error(
          `PurgeDeletedUsers FAILED ${logId} (prisma=${code}): ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
        ErrorReporter.captureException(err, {
          op: 'purgeDeletedUsers.hardDeleteUserTx',
          userId: u.id,
          prismaCode: code,
        });
        stats.skipped += 1;
      }
    }

    return stats;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Internal: actual delete transaction.
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Hard-delete user в одной транзакции:
   *   1. NULL'ить RESTRICT FK'ы (AuditLog.actorUserId, SubscriptionPayment.confirmedByUserId,
   *      Order.buyerId — последний через unset Buyer перед delete buyer).
   *   2. delete Buyer (если был) — cascade'ит в Cart/Wishlist/Address/Review/ChatThread.
   *   3. delete User — cascade'ит в Session/OTP/Notification* / SetNull в Order/Analytics history.
   *   4. Append AuditLog с action='USER_HARD_DELETED', actorUserId=null
   *      (system action) — для INV-A01 и compliance trail.
   *
   * Всё в одной $transaction → или всё применяется, или ничего (atomic per-user).
   */
  private async hardDeleteUserTx(userId: string, buyerId: string | null | undefined): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. RESTRICT FK на AuditLog → set NULL. История действий сохраняется
      //    (action/entityType/payload/createdAt immutable), только actor-FK
      //    становится anonymous.
      await tx.auditLog.updateMany({
        where: { actorUserId: userId },
        data: { actorUserId: null },
      });

      // 2. SubscriptionPayment.confirmedByUserId → NULL (история оплат остаётся).
      await tx.subscriptionPayment.updateMany({
        where: { confirmedByUserId: userId },
        data: { confirmedByUserId: null },
      });

      // 3. Если был Buyer — обнуляем buyerId в orders (история заказов
      //    сохраняется: orderNumber + customerPhone + customerFullName уже
      //    денормализованы на Order). Затем delete Buyer (cascade на cart/
      //    wishlist/address/review/chat-thread).
      if (buyerId) {
        await tx.order.updateMany({
          where: { buyerId },
          data: { buyerId: null },
        });
        await tx.buyer.delete({ where: { id: buyerId } });
      }

      // 4. Hard-delete User. Cascade прорабатывает session, account-deletion-otp,
      //    broadcast-log, in-app-notification, notification-preference,
      //    push-subscription, notification-log. SetNull прорабатывает
      //    referredBy, order-status-history.changedByUserId, analytics-events.actorUserId.
      await tx.user.delete({ where: { id: userId } });

      // 5. AuditLog append-only след. actorUserId=null (system action, нет
      //    реального user-инициатора). actorType='system'.
      await tx.auditLog.create({
        data: {
          actorUserId: null,
          actorType: 'system',
          entityType: 'User',
          entityId: userId,
          action: 'USER_HARD_DELETED',
          payload: {
            reason: 'AUTO_PURGE_90D',
            retentionDays: PurgeDeletedUsersProcessor.RETENTION_DAYS,
            executedAt: new Date().toISOString(),
          },
        },
      });
    });
  }

  // ────────────────────────────────────────────────────────────────────────

  private thresholdFrom(now: Date): Date {
    const ms = PurgeDeletedUsersProcessor.RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() - ms);
  }
}

/**
 * Маскируем телефон до последних 4 цифр для логирования.
 * Phone ВСЕГДА хранится в формате '+998XXXXXXXXX' (валидируется на регистрации),
 * но защищаемся от любой длины — берём конец строки.
 */
function phoneSuffix4(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, '*');
}
