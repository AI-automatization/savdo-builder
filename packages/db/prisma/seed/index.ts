import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const GLOBAL_CATEGORIES = [
  {
    nameRu: 'Электроника',
    nameUz: 'Elektronika',
    slug: 'elektronika',
    sortOrder: 0,
  },
  {
    nameRu: 'Одежда и обувь',
    nameUz: 'Kiyim va poyabzal',
    slug: 'kiyim-poyabzal',
    sortOrder: 1,
  },
  {
    nameRu: 'Продукты питания',
    nameUz: 'Oziq-ovqat mahsulotlari',
    slug: 'oziq-ovqat',
    sortOrder: 2,
  },
  {
    nameRu: 'Красота и здоровье',
    nameUz: 'Go\'zallik va salomatlik',
    slug: 'gozallik-salomatlik',
    sortOrder: 3,
  },
  {
    nameRu: 'Дом и сад',
    nameUz: 'Uy va bog\'',
    slug: 'uy-va-bog',
    sortOrder: 4,
  },
  {
    nameRu: 'Детские товары',
    nameUz: 'Bolalar tovarlari',
    slug: 'bolalar-tovarlari',
    sortOrder: 5,
  },
  {
    nameRu: 'Спорт и отдых',
    nameUz: 'Sport va dam olish',
    slug: 'sport-dam-olish',
    sortOrder: 6,
  },
  {
    nameRu: 'Авто товары',
    nameUz: 'Avto tovarlar',
    slug: 'avto-tovarlar',
    sortOrder: 7,
  },
  {
    nameRu: 'Книги и канцтовары',
    nameUz: 'Kitoblar va kanstovarlari',
    slug: 'kitoblar-kanstovarlari',
    sortOrder: 8,
  },
  {
    nameRu: 'Услуги',
    nameUz: 'Xizmatlar',
    slug: 'xizmatlar',
    sortOrder: 9,
  },
];

const ADMIN_PHONE = '+998910081910'; // Полат — superadmin

// ─────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────

async function seedGlobalCategories(): Promise<void> {
  console.log('Seeding global categories...');

  for (const category of GLOBAL_CATEGORIES) {
    const result = await prisma.globalCategory.upsert({
      where: { slug: category.slug },
      update: {
        nameRu: category.nameRu,
        nameUz: category.nameUz,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        nameRu: category.nameRu,
        nameUz: category.nameUz,
        slug: category.slug,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });

    console.log(`  [OK] ${result.nameRu} (slug: ${result.slug})`);
  }

  console.log(`Done. ${GLOBAL_CATEGORIES.length} categories upserted.\n`);
}

async function seedAdminUser(): Promise<void> {
  const env = process.env.NODE_ENV ?? 'development';
  console.log(`Seeding admin user (NODE_ENV=${env})...`);

  const user = await prisma.user.upsert({
    where: { phone: ADMIN_PHONE },
    update: {
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
    },
    create: {
      phone: ADMIN_PHONE,
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
    },
  });

  console.log(`  [OK] User created/updated: id=${user.id}, phone=${user.phone}`);

  const adminUser = await prisma.adminUser.upsert({
    where: { userId: user.id },
    update: {
      isSuperadmin: true,
    },
    create: {
      userId: user.id,
      isSuperadmin: true,
    },
  });

  console.log(`  [OK] AdminUser record: id=${adminUser.id}, isSuperadmin=${adminUser.isSuperadmin}`);
  console.log('Done.\n');
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('=== Savdo seed start ===\n');

  await seedGlobalCategories();
  await seedAdminUser();

  console.log('=== Savdo seed complete ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
