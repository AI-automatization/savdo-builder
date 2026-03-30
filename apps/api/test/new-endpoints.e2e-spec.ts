import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/database/prisma.service';
import { createTestApp, cleanDb } from './app.helper';

describe('New Endpoints E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let storeSlug: string;
  let productId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await cleanDb(prisma);
    await seedTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedTestData() {
    const user = await prisma.user.create({
      data: {
        phone: '+998901234001',
        role: 'SELLER',
        isPhoneVerified: true,
        seller: {
          create: {
            fullName: 'Test Seller',
            sellerType: 'individual',
            telegramUsername: '@testseller',
          },
        },
      },
      include: { seller: true },
    });

    const seller = (user as any).seller;

    const store = await prisma.store.create({
      data: {
        sellerId: seller.id,
        name: 'Test Shop',
        slug: 'test-shop-e2e',
        city: 'Tashkent',
        telegramContactLink: 'https://t.me/testshop',
        status: 'APPROVED',
        isPublic: true,
        deliverySettings: {
          create: {
            supportsDelivery: true,
            supportsPickup: false,
            deliveryFeeType: 'fixed',
          },
        },
      },
    });
    storeSlug = store.slug;

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: 'Test iPhone',
        description: 'Test product',
        basePrice: 13500000,
        currencyCode: 'UZS',
        status: 'ACTIVE',
        isVisible: true,
      },
    });
    productId = product.id;
  }

  // ─── Priority 1: Auth aliases ─────────────────────────────────────────────

  describe('POST /api/v1/auth/otp/send', () => {
    it('should send OTP and return expiresAt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ phone: '+998901111001', purpose: 'login' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'OTP sent');
      expect(res.body).toHaveProperty('expiresAt');
    });

    it('should reject invalid phone format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ phone: '998901111001', purpose: 'login' });

      expect(res.status).toBe(400);
    });

    it('should reject unknown purpose', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ phone: '+998901111001', purpose: 'hack' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/otp/verify', () => {
    it('should return 400 for wrong OTP code', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ phone: '+998901111002', purpose: 'login' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '+998901111002', code: '0000', purpose: 'login' });

      expect([400, 401]).toContain(res.status);
    });
  });

  // ─── Priority 2: GET /storefront/stores/:slug ─────────────────────────────

  describe('GET /api/v1/storefront/stores/:slug', () => {
    it('should return store data by slug', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/storefront/stores/${storeSlug}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('slug', storeSlug);
      expect(res.body).toHaveProperty('name', 'Test Shop');
    });

    it('should return 404 for unknown slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/storefront/stores/non-existent-xyz');

      expect(res.status).toBe(404);
    });
  });

  // ─── Priority 2: GET /stores/:slug ───────────────────────────────────────

  describe('GET /api/v1/stores/:slug', () => {
    it('should return store by slug', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/stores/${storeSlug}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('slug', storeSlug);
    });

    it('should return 404 for unknown slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/stores/no-such-store-xyz');

      expect(res.status).toBe(404);
    });
  });

  // ─── Priority 2: GET /stores/:slug/products ──────────────────────────────

  describe('GET /api/v1/stores/:slug/products', () => {
    it('should return products for store', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/stores/${storeSlug}/products`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title', 'Test iPhone');
    });

    it('should return 404 for unknown store slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/stores/no-such-store-xyz/products');

      expect(res.status).toBe(404);
    });
  });

  // ─── Priority 2: GET /stores/:slug/products/:id ──────────────────────────

  describe('GET /api/v1/stores/:slug/products/:id', () => {
    it('should return product detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/stores/${storeSlug}/products/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', productId);
      expect(res.body).toHaveProperty('title', 'Test iPhone');
    });

    it('should return 404 for product with wrong store slug', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/stores/no-such-store-xyz/products/${productId}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── Protected endpoints (no auth → 401) ─────────────────────────────────

  describe('POST /api/v1/orders (requires auth)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ deliveryAddress: { street: 'Test st', city: 'Tashkent', country: 'UZ' } });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/orders/:id (requires auth)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders/some-order-id');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/seller/metrics (requires auth)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/seller/metrics');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/seller/store (requires auth)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/seller/store')
        .send({ name: 'Updated Shop' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/seller/orders (requires auth)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/seller/orders');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/seller/orders/:id/status (requires auth)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/seller/orders/some-id/status')
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(401);
    });
  });
});
