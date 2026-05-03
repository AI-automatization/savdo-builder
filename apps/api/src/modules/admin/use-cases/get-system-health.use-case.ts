import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../shared/redis.service';

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  uptime: number; // seconds since process start
  timestamp: string;
  checks: {
    database: { ok: boolean; latencyMs: number; error?: string };
    redis: { ok: boolean; latencyMs: number; error?: string };
    storage: { ok: boolean; configured: boolean };
  };
  metrics: {
    nodeVersion: string;
    memoryMb: number;
    rssMb: number;
    cpuLoadPct?: number;
  };
  features: {
    chatEnabled: boolean;
    storeApprovalRequired: boolean;
    devOtpEnabled: boolean;
    telegramNotifications: boolean;
    paymentOnline: boolean;
  };
}

@Injectable()
export class GetSystemHealthUseCase {
  private readonly logger = new Logger(GetSystemHealthUseCase.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(): Promise<SystemHealth> {
    const [dbCheck, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const storageConfigured = Boolean(process.env.STORAGE_ENDPOINT && process.env.STORAGE_ACCESS_KEY_ID);

    const allOk = dbCheck.ok && redisCheck.ok;
    const anyDown = !dbCheck.ok || !redisCheck.ok;
    const status: SystemHealth['status'] = allOk ? 'ok' : anyDown ? 'down' : 'degraded';

    const memUsage = process.memoryUsage();

    return {
      status,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck,
        redis: redisCheck,
        storage: { ok: storageConfigured, configured: storageConfigured },
      },
      metrics: {
        nodeVersion: process.version,
        memoryMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
      },
      features: {
        chatEnabled:           process.env.CHAT_ENABLED !== 'false',
        storeApprovalRequired: process.env.STORE_APPROVAL_REQUIRED !== 'false',
        devOtpEnabled:         process.env.DEV_OTP_ENABLED === 'true',
        telegramNotifications: process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'false',
        paymentOnline:         process.env.PAYMENT_ONLINE_ENABLED === 'true',
      },
    };
  }

  private async checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const t0 = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - t0 };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : 'unknown error',
      };
    }
  }

  private async checkRedis(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const t0 = Date.now();
    try {
      await this.redis.set('__health_ping__', '1', 5);
      const v = await this.redis.get('__health_ping__');
      if (v !== '1') throw new Error('Redis ping mismatch');
      return { ok: true, latencyMs: Date.now() - t0 };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : 'unknown error',
      };
    }
  }
}
