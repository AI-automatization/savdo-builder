import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  // ── Admin user ────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { phone: '+998910081910' },
    update: {},
    create: {
      phone: '+998910081910',
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
      languageCode: 'ru',
    },
  });

  await prisma.adminUser.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id, isSuperadmin: true },
  });

  console.log('✅ Admin user:', adminUser.phone);

  // ── Test seller (PENDING) ─────────────────────────────────────────────────
  const sellerUser = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: {},
    create: {
      phone: '+998901234567',
      role: 'SELLER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      languageCode: 'ru',
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      fullName: 'Тест Продавец',
      bio: 'Тестовый аккаунт продавца для разработки',
      verificationStatus: 'PENDING',
      isBlocked: false,
    },
  });

  console.log('✅ Test seller (PENDING):', sellerUser.phone);

  // ── Test store ────────────────────────────────────────────────────────────
  const store = await prisma.store.upsert({
    where: { slug: 'test-store' },
    update: {},
    create: {
      sellerId: seller.id,
      name: 'Тестовый Магазин',
      slug: 'test-store',
      description: 'Магазин для тестирования admin панели',
      status: 'PENDING_REVIEW',
    },
  });

  console.log('✅ Test store:', store.slug);

  // ── Test products ─────────────────────────────────────────────────────────
  const category = await prisma.category.findFirst({ where: { storeId: store.id } })
    ?? await prisma.category.create({
      data: { storeId: store.id, name: 'Тестовая категория', slug: 'test-cat', sortOrder: 0 },
    });

  for (let i = 1; i <= 3; i++) {
    const product = await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: `test-product-${i}` } },
      update: {},
      create: {
        storeId: store.id,
        categoryId: category.id,
        name: `Тестовый товар ${i}`,
        slug: `test-product-${i}`,
        description: `Описание тестового товара ${i}`,
        status: 'ACTIVE',
        basePrice: BigInt(i * 50000 * 100), // in tiyin
        currencyCode: 'UZS',
      },
    });

    await prisma.productVariant.upsert({
      where: { id: `seed-variant-${i}` },
      update: {},
      create: {
        id: `seed-variant-${i}`,
        productId: product.id,
        sku: `SKU-TEST-${i}`,
        price: BigInt(i * 50000 * 100),
        stock: 10,
      },
    });
  }

  console.log('✅ 3 test products created');

  // ── Test buyer + order ────────────────────────────────────────────────────
  const buyerUser = await prisma.user.upsert({
    where: { phone: '+998909876543' },
    update: {},
    create: {
      phone: '+998909876543',
      role: 'BUYER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      languageCode: 'ru',
    },
  });

  const buyer = await prisma.buyer.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: { userId: buyerUser.id },
  });

  const existingOrder = await prisma.order.findFirst({ where: { orderNumber: 'TEST-001' } });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        orderNumber: 'TEST-001',
        storeId: store.id,
        buyerId: buyer.id,
        status: 'PENDING',
        totalAmount: BigInt(150000 * 100),
        currencyCode: 'UZS',
        customerFullName: 'Тест Покупатель',
        customerPhone: '+998909876543',
        deliveryFeeAmount: BigInt(0),
        items: {
          create: {
            productId: (await prisma.product.findFirst({ where: { storeId: store.id } }))!.id,
            variantId: `seed-variant-1`,
            productName: 'Тестовый товар 1',
            variantSku: 'SKU-TEST-1',
            quantity: 1,
            unitPrice: BigInt(150000 * 100),
            totalPrice: BigInt(150000 * 100),
          },
        },
      },
    });
  }

  console.log('✅ Test buyer + order TEST-001 created');
  console.log('\n🎉 Seed complete!');
  console.log('Admin login: +998910081910');
  console.log('Test seller: +998901234567 (status: PENDING)');
  console.log('Test buyer:  +998909876543');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
