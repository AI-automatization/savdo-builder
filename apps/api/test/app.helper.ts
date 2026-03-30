import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

let app: INestApplication;
let prisma: PrismaService;

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  prisma = moduleRef.get(PrismaService);
  await app.init();
  return app;
}

export function getPrisma(): PrismaService {
  return prisma;
}

export async function cleanDb(prismaService: PrismaService) {
  await prismaService.$executeRawUnsafe(`
    TRUNCATE TABLE
      otp_requests, user_sessions, users, buyers, sellers, stores,
      products, product_variants, carts, cart_items,
      orders, order_items, analytics_events,
      in_app_notifications, notification_preferences, notification_logs
    RESTART IDENTITY CASCADE
  `);
}
