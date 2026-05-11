import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../shared/redis.service';

export interface CachedResponse {
  status: number;
  body: unknown;
}

const TTL_SECONDS = 24 * 60 * 60; // 24h, как Stripe — даём клиенту окно на ретраи
const LOCK_TTL_SECONDS = 30;       // блокировка на время выполнения handler

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Хэшируем (key + userId + route) — один и тот же ключ для разных юзеров /
   * разных endpoints не должен пересекаться. SHA-256 чтобы не светить
   * клиентский ключ в Redis-логах при дебаге.
   */
  buildCacheKey(idempotencyKey: string, userId: string, route: string): string {
    const hash = createHash('sha256')
      .update(`${idempotencyKey}:${userId}:${route}`)
      .digest('hex')
      .slice(0, 32);
    return `idem:${hash}`;
  }

  async getCached(cacheKey: string): Promise<CachedResponse | null> {
    try {
      const raw = await this.redis.get(cacheKey);
      if (!raw) return null;
      // marker для in-flight lock (см. lock())
      if (raw === '__lock__') return null;
      return JSON.parse(raw) as CachedResponse;
    } catch (err) {
      this.logger.warn(`Idempotency cache read failed: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Атомарный lock: SET key value NX EX. Возвращает true если получили lock,
   * false если уже занят (либо in-flight другой запрос, либо есть кэш).
   * RedisService.set не возвращает NX-результат, поэтому делаем guard через
   * read-then-set (race окно ~ms — для нашего сценария приемлемо, defence-in-depth
   * через DB unique constraints на orderNumber).
   */
  async acquireLock(cacheKey: string): Promise<boolean> {
    try {
      const existing = await this.redis.get(cacheKey);
      if (existing !== null) return false;
      await this.redis.set(cacheKey, '__lock__', LOCK_TTL_SECONDS);
      return true;
    } catch (err) {
      this.logger.warn(`Idempotency lock acquire failed: ${(err as Error).message}`);
      return true; // fail-open: при недоступности Redis не ломаем основной flow
    }
  }

  async storeResponse(cacheKey: string, response: CachedResponse): Promise<void> {
    try {
      await this.redis.set(cacheKey, JSON.stringify(response), TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`Idempotency store failed: ${(err as Error).message}`);
    }
  }

  async releaseLock(cacheKey: string): Promise<void> {
    try {
      const current = await this.redis.get(cacheKey);
      if (current === '__lock__') {
        await this.redis.del(cacheKey);
      }
    } catch (err) {
      this.logger.warn(`Idempotency lock release failed: ${(err as Error).message}`);
    }
  }
}
