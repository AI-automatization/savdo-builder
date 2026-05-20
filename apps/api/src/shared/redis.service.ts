import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('redis.url') ?? 'redis://localhost:6379';
    // API-REDIS-RESILIENCE-001: устойчивость к недоступности Redis.
    //  - retryStrategy: экспоненциальный backoff с потолком 10с (не сыпать
    //    reconnect-штормом, но и не сдаваться — Railway Redis может моргнуть).
    //  - maxRetriesPerRequest: команды fail-fast (ошибка вместо вечного
    //    зависания запроса). Все вызовы set/get/del обёрнуты в try/catch у
    //    caller'ов (otp.service, idempotency.service) → graceful degrade.
    //  - enableOfflineQueue: false — пока Redis недоступен, команды сразу
    //    реджектятся, а не копятся в памяти (избегаем OOM при долгом дауне).
    //  - connectTimeout: 10с вместо дефолтных бесконечных попыток.
    //  - enableReadyCheck: true — клиент готов только после реального PONG.
    this.client = new Redis(url, {
      lazyConnect: false,
      connectTimeout: 10_000,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      enableReadyCheck: true,
      retryStrategy: (times: number) => Math.min(times * 200, 10_000),
    });
    // 'error' только логируем — unhandled 'error' на ioredis НЕ валит процесс,
    // но без обработчика Node выбросит warning. Никакого process.exit/throw.
    this.client.on('error', (err: Error) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
    this.client.on('reconnecting', () =>
      this.logger.warn('Redis reconnecting...'),
    );
    this.client.on('ready', () => this.logger.log('Redis connection ready'));
  }

  async onModuleDestroy() {
    // quit() может зависнуть если Redis недоступен — не блокируем shutdown.
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Healthcheck-friendly ping. Возвращает true если Redis отвечает PONG. */
  async ping(): Promise<boolean> {
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }
}
