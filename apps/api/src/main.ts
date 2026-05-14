import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './socket/redis-io.adapter';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { StructuredLogger } from './shared/structured-logger';

// Prisma returns BigInt for telegramId — JSON.stringify crashes without this polyfill
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // API-PINO-LOGGING-001: structured JSON logging в production (Railway).
  // В dev — fallback на цветной ConsoleLogger.
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger(),
  });

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

  // Swagger / OpenAPI doc — в production выключен (раскрытие endpoints/DTOs).
  // Опционально включается через `SWAGGER_ENABLED=true` для staging окружения.
  // QA-AUDIT-SEC-A05: Swagger в проде = leak шапок endpoints + payload schemas.
  const swaggerEnabled = !isProd || process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Savdo API')
      .setDescription('Backend для savdo-builder — TG-storefront + buyer/seller flows.')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', in: 'header' },
        'jwt',
      )
      .addTag('admin',      'Admin/super-admin operations')
      .addTag('seller',     'Seller-side: products, variants, orders, store')
      .addTag('storefront', 'Public read-only — товары и магазины')
      .addTag('buyer',      'Buyer flow: cart, checkout, orders, wishlist')
      .addTag('chat',       'Chat threads + messages (buyer ↔ seller)')
      .addTag('moderation', 'Cases / actions / audit log')
      .addTag('auth',       'OTP login + Telegram WebApp auth')
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, swaggerDocument, {
      swaggerOptions: { persistAuthorization: true },
    });
    Logger.log('Swagger UI mounted at /api/v1/docs', 'Bootstrap');
  } else {
    Logger.log('Swagger disabled in production (set SWAGGER_ENABLED=true to override)', 'Bootstrap');
  }

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

      // Auth: либо BULL_BOARD_TOKEN env (legacy fallback), либо валидный admin
      // access JWT (предпочтительно — admin SPA автоматически подставляет
      // свой access token в ?token query). JwtAuthGuard через guard здесь не
      // подключить — Bull Board сам ставит express middleware. Поэтому ручная
      // jwt.verify через @nestjs/jwt токен.
      const jwtService = app.get(JwtService);
      const jwtSecret = app.get(ConfigService).get<string>('jwt.accessSecret');
      const httpAdapter = app.getHttpAdapter() as any;

      const BULL_COOKIE = 'bull-board-token';
      const COOKIE_TTL_MS = 30 * 60 * 1000; // 30 min — короче чем access JWT

      // Bull Board middleware. Token принимаем из (приоритет):
      // 1. ?token= (первый клик из admin SPA, передаёт access JWT через URL)
      // 2. Authorization: Bearer (curl/Postman)
      // 3. Cookie `bull-board-token` (browser subsequent requests — static
      //    CSS/JS НЕ передают token в URL, поэтому ставим cookie после
      //    успешной валидации первого запроса).
      //
      // SEC: cookie HttpOnly + SameSite=Strict + Secure в production.
      // Не используется для CSRF-чувствительных операций — Bull Board UI
      // только показывает jobs (read-only через UI, write via API уже под JWT).
      httpAdapter.use('/api/v1/admin/queues', (req: any, res: any, next: any) => {
        const auth = req.headers.authorization || '';
        const cookieHeader: string = req.headers.cookie || '';
        const cookieToken = cookieHeader
          .split(';')
          .map((s: string) => s.trim())
          .find((c: string) => c.startsWith(`${BULL_COOKIE}=`))
          ?.slice(BULL_COOKIE.length + 1);

        const rawToken = (req.query?.token as string | undefined)
          || (auth.startsWith('Bearer ') ? auth.slice(7) : '')
          || cookieToken;

        if (!rawToken) {
          return res.status(401).send('Unauthorized — pass ?token=<admin-access-jwt>');
        }

        const legacyToken = process.env.BULL_BOARD_TOKEN;
        if (legacyToken && rawToken === legacyToken) {
          return next();
        }

        try {
          const decoded = jwtService.verify<{ role?: string }>(rawToken, { secret: jwtSecret });
          if (decoded.role !== 'ADMIN') {
            return res.status(403).send('Forbidden — admin role required');
          }
          // Set/refresh cookie только если token пришёл из query или header.
          // Это исключает cookie-refresh цикл на каждый static asset request.
          if (rawToken !== cookieToken) {
            const flags = [
              `${BULL_COOKIE}=${rawToken}`,
              'Path=/api/v1/admin/queues',
              'HttpOnly',
              'SameSite=Strict',
              `Max-Age=${Math.floor(COOKIE_TTL_MS / 1000)}`,
            ];
            if (isProd) flags.push('Secure');
            res.setHeader('Set-Cookie', flags.join('; '));
          }
          return next();
        } catch {
          return res.status(401).send('Invalid or expired token');
        }
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
