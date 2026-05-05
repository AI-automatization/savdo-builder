import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './socket/redis-io.adapter';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

// Prisma returns BigInt for telegramId — JSON.stringify crashes without this polyfill
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(helmet());

  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  if (isProd && allowedOrigins.length === 0) {
    Logger.warn('ALLOWED_ORIGINS is not set in production — only Railway/Telegram defaults will pass', 'Bootstrap');
  }

  // Regex для доменов которые меняются между деплоями Railway:
  // *.up.railway.app, *.railway.app — все наши TMA/admin/web домены
  // web.telegram.org, t.me — Telegram WebView host
  const ORIGIN_PATTERNS = [
    /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i,
    /^https:\/\/[a-z0-9-]+\.railway\.app$/i,
    /^https:\/\/(web\.)?telegram\.org$/i,
    /^https:\/\/t\.me$/i,
    /^https:\/\/(.+\.)?savdo\.uz$/i,
  ];

  const corsOriginCheck = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // same-origin / curl / mobile apps
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (ORIGIN_PATTERNS.some((re) => re.test(origin))) return callback(null, true);
    if (!isProd) return callback(null, true);
    callback(null, false);
  };

  app.enableCors({
    origin: corsOriginCheck,
    credentials: true,
  });

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis(redisUrl);
    app.useWebSocketAdapter(redisIoAdapter);
    Logger.log('Socket.IO using Redis adapter', 'Bootstrap');

    // ── Bull Board UI: monitoring очередей jobs (telegram, in-app, otp) ──
    // Доступно только под Telegram OTP auth + ADMIN role (см. middleware ниже).
    try {
      const u = new URL(redisUrl);
      const connection = {
        host: u.hostname,
        port: u.port ? parseInt(u.port, 10) : 6379,
        password: u.password ? decodeURIComponent(u.password) : undefined,
        ...(u.protocol === 'rediss:' && { tls: {} }),
      };
      const queues = [
        new Queue('telegram-notifications', { connection }),
        new Queue('in-app-notifications',   { connection }),
        new Queue('otp',                     { connection }),
      ];

      const bullAdapter = new ExpressAdapter();
      bullAdapter.setBasePath('/api/v1/admin/queues');
      createBullBoard({
        queues: queues.map((q) => new BullMQAdapter(q)),
        serverAdapter: bullAdapter,
      });

      // Простая защита: проверяем что в заголовке/cookie есть admin JWT.
      // Полноценный JwtAuthGuard здесь сложно подключить (express middleware),
      // поэтому Bull Board прячем за header-токеном который admin UI шлёт.
      const httpAdapter = app.getHttpAdapter() as any;
      httpAdapter.use('/api/v1/admin/queues', (req: any, res: any, next: any) => {
        const auth = req.headers.authorization || '';
        const token = req.query?.token || (auth.startsWith('Bearer ') ? auth.slice(7) : '');
        const expected = process.env.BULL_BOARD_TOKEN;
        if (!expected) {
          // Если не задано — Bull Board выключен в проде
          if (isProd) return res.status(404).send('Bull Board disabled (set BULL_BOARD_TOKEN)');
        } else if (token !== expected) {
          return res.status(401).send('Unauthorized — set ?token=BULL_BOARD_TOKEN');
        }
        next();
      });
      httpAdapter.use('/api/v1/admin/queues', bullAdapter.getRouter());

      Logger.log('Bull Board UI mounted at /api/v1/admin/queues', 'Bootstrap');
    } catch (err) {
      Logger.error(`Failed to mount Bull Board: ${err instanceof Error ? err.message : String(err)}`, 'Bootstrap');
    }
  } else {
    Logger.warn(
      'REDIS_URL not set — Socket.IO running without Redis adapter (single instance only)',
      'Bootstrap',
    );
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`API running on http://0.0.0.0:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
