import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const QUEUE_TELEGRAM_NOTIFICATIONS = 'telegram-notifications';
export const QUEUE_IN_APP_NOTIFICATIONS = 'in-app-notifications';
export const QUEUE_OTP = 'otp';
// API-ACCOUNT-PURGE-001: имя очереди зарезервировано на будущее (миграция на
// BullMQ repeatable job при горизонтальном масштабировании API). v1 крутится
// через @nestjs/schedule @Cron в одиночном Railway-инстансе — см.
// queues/processors/purge-deleted-users.processor.ts.
export const QUEUE_ACCOUNT_DELETION_PURGE = 'account-deletion-purge';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          // ioredis accepts a URL string directly
          // BullMQ's ConnectionOptions accepts lazyConnect + host/port, but the
          // simplest approach for a URL is to pass it as the `url` field via a
          // custom ioredis instance. Here we parse the URL so BullMQ can build
          // its own ioredis connection without extra dependencies.
          ...parseRedisUrl(config.get<string>('redis.url') ?? 'redis://localhost:6379'),
          // API-REDIS-RESILIENCE-001: устойчивость к недоступности Redis.
          //  - maxRetriesPerRequest: null — ОБЯЗАТЕЛЬНО для BullMQ (worker'ы
          //    используют блокирующие команды; любое число их ломает).
          //  - retryStrategy — экспоненциальный backoff с потолком 10с вместо
          //    bare-loop reconnect, чтобы Redis-down не спамил ETIMEDOUT в лог.
          //  - connectTimeout — попытка коннекта не висит вечно.
          //  Цель: при недоступном Redis на старте API поднимается в degraded-
          //  режиме (healthcheck /health/live это переживает), а не крашится.
          maxRetriesPerRequest: null,
          retryStrategy: (times: number) => Math.min(times * 200, 10_000),
          connectTimeout: 10_000,
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_TELEGRAM_NOTIFICATIONS,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      },
      {
        name: QUEUE_IN_APP_NOTIFICATIONS,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      },
      {
        name: QUEUE_OTP,
        defaultJobOptions: {
          // OTP critical — retry quickly, short window
          attempts: 5,
          backoff: { type: 'exponential', delay: 500 },
          removeOnComplete: { count: 50 },
          removeOnFail: { count: 100 },
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}

// ---------------------------------------------------------------------------
// Minimal Redis URL parser → { host, port, password?, db? }
// Handles: redis://[:password@]host[:port][/db]
//          rediss://... (TLS — sets tls: true)
// ---------------------------------------------------------------------------
function parseRedisUrl(url: string): Record<string, unknown> {
  try {
    const parsed = new URL(url);
    const opts: Record<string, unknown> = {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
    };
    if (parsed.password) {
      opts.password = decodeURIComponent(parsed.password);
    }
    const db = parsed.pathname?.replace('/', '');
    if (db && /^\d+$/.test(db)) {
      opts.db = parseInt(db, 10);
    }
    if (parsed.protocol === 'rediss:') {
      opts.tls = {};
    }
    return opts;
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}
