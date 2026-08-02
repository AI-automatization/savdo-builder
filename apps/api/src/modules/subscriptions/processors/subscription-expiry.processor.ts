import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpireSubscriptionsUseCase } from '../use-cases/expire-subscriptions.use-case';

/**
 * SubscriptionExpiryProcessor — daily cron, BILLING-MACHINE-001.
 *
 * Расписание: '0 3 * * *' (03:00 UTC = 08:00 Asia/Tashkent).
 *   - 8 утра по локальному времени — продавцы как раз открывают админку и
 *     увидят актуальный PAST_DUE/SUSPENDED статус сразу с утра.
 *   - UTC выбран осознанно: сервер на Railway работает в UTC, поэтому cron
 *     не плывёт от DST/региона деплоя.
 *
 * Подход: `@nestjs/schedule` `@Cron` напрямую вызывает ExpireSubscriptionsUseCase.
 * Не используем BullMQ repeat/queue, потому что:
 *  - Use case полностью идемпотентен (фильтрует по статусу + дате) — повторный
 *    запуск в течение суток безопасен и не делает лишней работы.
 *  - Запускается раз в сутки, выполняется быстро (батч переходов), без длинных
 *    side-effects наружу (нет TG-нотификаций, нет внешних API).
 *  - На Railway единственный инстанс API → distributed-lock не нужен; при
 *    масштабировании можно мигрировать на BullMQ repeatable job с stable jobId.
 *
 * Обработка ошибок: try/catch + Logger.error, без re-throw. Если упадёт — cron
 * запустится завтра снова; падение НЕ должно ронять @nestjs/schedule runner.
 */
@Injectable()
export class SubscriptionExpiryProcessor {
  private readonly logger = new Logger(SubscriptionExpiryProcessor.name);

  constructor(
    private readonly expireSubscriptions: ExpireSubscriptionsUseCase,
  ) {}

  @Cron('0 3 * * *', {
    name: 'subscription-expiry-daily',
    timeZone: 'UTC',
  })
  async run(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('SubscriptionExpiry cron started');

    try {
      const stats = await this.expireSubscriptions.execute();
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `SubscriptionExpiry cron finished in ${durationMs}ms: ` +
          `trial→past_due=${stats.trial}, ` +
          `active→past_due=${stats.active}, ` +
          `past_due→suspended=${stats.suspended}`,
      );
    } catch (err) {
      // Не пробрасываем — иначе @nestjs/schedule может пометить таск как failed
      // и в худшем случае не запустит на следующий день. Лучше пропустить
      // одну итерацию и попробовать снова через сутки.
      this.logger.error(
        `SubscriptionExpiry cron failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }
}
