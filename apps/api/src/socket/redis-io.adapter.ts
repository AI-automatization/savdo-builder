import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  async connectToRedis(redisUrl: string): Promise<void> {
    // API-REDIS-RESILIENCE-001: connectTimeout — connect() не висит вечно
    // (caller в main.ts ловит ошибку и стартует API без адаптера).
    // reconnectStrategy — backoff с потолком 10с после первого коннекта.
    const pubClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10_000,
        reconnectStrategy: (retries: number) => Math.min(retries * 200, 10_000),
      },
    });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) =>
      this.logger.error('Redis pub client error', err),
    );
    subClient.on('error', (err) =>
      this.logger.error('Redis sub client error', err),
    );

    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('Socket.IO Redis adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
