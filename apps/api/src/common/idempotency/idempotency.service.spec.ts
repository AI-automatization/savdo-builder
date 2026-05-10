/**
 * Тесты для `IdempotencyService`.
 *
 * Покрытие:
 *   - buildCacheKey: SHA-256 hash, разные user/route → разные ключи
 *   - getCached: miss / hit / lock-marker / Redis fail → fail-open null
 *   - acquireLock: NX-семантика через read-then-set, fail-open=true при Redis fail
 *   - storeResponse + releaseLock: TTL пропускается, lock не очищается если уже cached
 */
import { IdempotencyService } from './idempotency.service';
import { RedisService } from '../../shared/redis.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    service = new IdempotencyService(redis as unknown as RedisService);
  });

  describe('buildCacheKey', () => {
    it('возвращает префикс idem: + 32 hex', () => {
      const key = service.buildCacheKey('client-key-1', 'user-1', 'POST:/orders');
      expect(key).toMatch(/^idem:[a-f0-9]{32}$/);
    });

    it('разные userId → разные хэши (cross-user isolation)', () => {
      const a = service.buildCacheKey('same-key', 'user-A', 'POST:/orders');
      const b = service.buildCacheKey('same-key', 'user-B', 'POST:/orders');
      expect(a).not.toBe(b);
    });

    it('разные route → разные хэши (per-endpoint isolation)', () => {
      const a = service.buildCacheKey('same-key', 'user-A', 'POST:/orders');
      const b = service.buildCacheKey('same-key', 'user-A', 'POST:/checkout/confirm');
      expect(a).not.toBe(b);
    });

    it('одинаковый input → одинаковый output (детерминированность)', () => {
      const a = service.buildCacheKey('k', 'u', 'r');
      const b = service.buildCacheKey('k', 'u', 'r');
      expect(a).toBe(b);
    });
  });

  describe('getCached', () => {
    it('пусто → null', async () => {
      redis.get.mockResolvedValue(null);
      expect(await service.getCached('idem:x')).toBeNull();
    });

    it('lock marker __lock__ → null (in-flight, не treat как cached)', async () => {
      redis.get.mockResolvedValue('__lock__');
      expect(await service.getCached('idem:x')).toBeNull();
    });

    it('JSON cached response → парсится', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ status: 201, body: { id: 'ord-1' } }));
      const result = await service.getCached('idem:x');
      expect(result).toEqual({ status: 201, body: { id: 'ord-1' } });
    });

    it('Redis throws → fail-open null', async () => {
      redis.get.mockRejectedValue(new Error('Redis down'));
      expect(await service.getCached('idem:x')).toBeNull();
    });

    it('невалидный JSON → fail-open null', async () => {
      redis.get.mockResolvedValue('{not-json}');
      expect(await service.getCached('idem:x')).toBeNull();
    });
  });

  describe('acquireLock', () => {
    it('пусто → set __lock__ с TTL 30s + true', async () => {
      redis.get.mockResolvedValue(null);
      const acquired = await service.acquireLock('idem:x');
      expect(acquired).toBe(true);
      expect(redis.set).toHaveBeenCalledWith('idem:x', '__lock__', 30);
    });

    it('уже занят (lock) → false', async () => {
      redis.get.mockResolvedValue('__lock__');
      const acquired = await service.acquireLock('idem:x');
      expect(acquired).toBe(false);
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('уже есть cached response → false', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ status: 201, body: {} }));
      const acquired = await service.acquireLock('idem:x');
      expect(acquired).toBe(false);
    });

    it('Redis fail → fail-open true (не блокируем основной flow)', async () => {
      redis.get.mockRejectedValue(new Error('Redis down'));
      const acquired = await service.acquireLock('idem:x');
      expect(acquired).toBe(true);
    });
  });

  describe('storeResponse', () => {
    it('сериализует body + status и сохраняет с TTL 24h', async () => {
      await service.storeResponse('idem:x', { status: 201, body: { id: 'ord-1' } });
      expect(redis.set).toHaveBeenCalledWith(
        'idem:x',
        JSON.stringify({ status: 201, body: { id: 'ord-1' } }),
        24 * 60 * 60,
      );
    });

    it('Redis fail → не падает (best-effort)', async () => {
      redis.set.mockRejectedValue(new Error('Redis down'));
      await expect(service.storeResponse('idem:x', { status: 200, body: null })).resolves.toBeUndefined();
    });
  });

  describe('releaseLock', () => {
    it('lock marker → del', async () => {
      redis.get.mockResolvedValue('__lock__');
      await service.releaseLock('idem:x');
      expect(redis.del).toHaveBeenCalledWith('idem:x');
    });

    it('cached response → НЕ del (защита от случайного wipe валидного кэша)', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ status: 200, body: {} }));
      await service.releaseLock('idem:x');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('пусто → не del', async () => {
      redis.get.mockResolvedValue(null);
      await service.releaseLock('idem:x');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('Redis fail → не падает', async () => {
      redis.get.mockRejectedValue(new Error('Redis down'));
      await expect(service.releaseLock('idem:x')).resolves.toBeUndefined();
    });
  });
});
