import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './socket/redis-io.adapter';

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

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  });

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis(redisUrl);
    app.useWebSocketAdapter(redisIoAdapter);
    Logger.log('Socket.IO using Redis adapter', 'Bootstrap');
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
