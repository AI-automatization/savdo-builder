import { Controller, Get, HttpCode, HttpStatus, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../shared/redis.service';

/**
 * Healthcheck для Railway healthcheckPath.
 *
 * Раньше возвращал тривиальный {status:'ok'} → Railway не понимал когда
 * БД отвалилась и не перезапускал pod. Сейчас:
 *
 *   - DB ping (SELECT 1) → CRITICAL. Если падает — 503 → Railway рестартит.
 *   - Redis ping → WARNING. Если падает — 200 но с degraded:true в response.
 *     Redis non-critical (только для OTP cache + tg:phone session); API
 *     может работать без него на низком QPS, рестартить за это нет смысла.
 *
 * Timeout 1.5 сек на оба — чтобы healthcheck не висел при медленном backend.
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    const [dbOk, redisOk] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
    ]);

    if (!dbOk) {
      this.logger.error('Healthcheck: DB DOWN');
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'down', db: 'down', redis: redisOk ? 'up' : 'down' };
    }

    if (!redisOk) {
      this.logger.warn('Healthcheck: Redis down (degraded mode)');
      return { status: 'degraded', db: 'up', redis: 'down' };
    }

    return { status: 'ok', db: 'up', redis: 'up' };
  }

  /** Liveness — проверяет что процесс жив (без БД/Redis). Для k8s/Railway probe. */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return { status: 'ok' };
  }

  private async checkDb(): Promise<boolean> {
    return Promise.race([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
    ]);
  }

  private async checkRedis(): Promise<boolean> {
    return Promise.race([
      this.redis.ping(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
    ]);
  }
}
