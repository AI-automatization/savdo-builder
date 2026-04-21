import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RawCategory {
  slug: string;
  nameRu: string;
  nameUz: string;
  parentSlug: string | null;
  level: number;
  sortOrder: number;
}

const RAW: RawCategory[] = [
  // ── Level 0 (root) ─────────────────────────────────────────────────────────
  { slug: 'electronics',   nameRu: 'Электроника',         nameUz: 'Elektronika',          parentSlug: null, level: 0, sortOrder: 10 },
  { slug: 'appliances',    nameRu: 'Бытовая техника',     nameUz: 'Maishiy texnika',       parentSlug: null, level: 0, sortOrder: 20 },
  { slug: 'clothing',      nameRu: 'Одежда',              nameUz: 'Kiyimlar',              parentSlug: null, level: 0, sortOrder: 30 },
  { slug: 'automotive',    nameRu: 'Автомобили',          nameUz: 'Avtomobillar',          parentSlug: null, level: 0, sortOrder: 40 },
  { slug: 'furniture',     nameRu: 'Мебель',              nameUz: 'Mebel',                 parentSlug: null, level: 0, sortOrder: 50 },
  { slug: 'books',         nameRu: 'Книги',               nameUz: 'Kitoblar',              parentSlug: null, level: 0, sortOrder: 60 },
  { slug: 'outdoor',       nameRu: 'На открытом воздухе', nameUz: 'Ochiq havoda',          parentSlug: null, level: 0, sortOrder: 70 },

  // ── Level 1 — Electronics ──────────────────────────────────────────────────
  { slug: 'phones',                  nameRu: 'Телефоны',                 nameUz: 'Telefonlar',               parentSlug: 'electronics', level: 1, sortOrder: 10 },
  { slug: 'tablets',                 nameRu: 'Планшеты',                 nameUz: 'Planshetlar',              parentSlug: 'electronics', level: 1, sortOrder: 20 },
  { slug: 'laptops',                 nameRu: 'Ноутбуки',                 nameUz: 'Noutbuklar',               parentSlug: 'electronics', level: 1, sortOrder: 30 },
  { slug: 'pc',                      nameRu: 'Персональные компьютеры',  nameUz: 'Shaxsiy kompyuterlar',     parentSlug: 'electronics', level: 1, sortOrder: 40 },
  { slug: 'cameras',                 nameRu: 'Фотокамеры',               nameUz: 'Fotokameralar',             parentSlug: 'electronics', level: 1, sortOrder: 50 },
  { slug: 'audio',                   nameRu: 'Аудио',                    nameUz: 'Audio',                    parentSlug: 'electronics', level: 1, sortOrder: 60 },
  { slug: 'tv',                      nameRu: 'Телевизоры',               nameUz: 'Televizorlar',             parentSlug: 'electronics', level: 1, sortOrder: 70 },
  { slug: 'electronics_components',  nameRu: 'Электронные компоненты',   nameUz: 'Elektron komponentlar',    parentSlug: 'electronics', level: 1, sortOrder: 80 },

  // ── Level 1 — Appliances ───────────────────────────────────────────────────
  { slug: 'kitchen',          nameRu: 'Кухонная техника',        nameUz: 'Oshxona texnikasi',          parentSlug: 'appliances', level: 1, sortOrder: 10 },
  { slug: 'washing_machines', nameRu: 'Стиральные машины',       nameUz: 'Kir yuvish mashinalari',     parentSlug: 'appliances', level: 1, sortOrder: 20 },
  { slug: 'dishes',           nameRu: 'Посудомоечные машины',    nameUz: 'Idish yuvish mashinalari',   parentSlug: 'appliances', level: 1, sortOrder: 30 },
  { slug: 'refrigerators',    nameRu: 'Холодильники',            nameUz: 'Muzlatgichlar',              parentSlug: 'appliances', level: 1, sortOrder: 40 },

  // ── Level 1 — Clothing ─────────────────────────────────────────────────────
  { slug: 'mens_clothing',        nameRu: 'Мужская одежда',     nameUz: 'Erkaklar kiyimi',      parentSlug: 'clothing', level: 1, sortOrder: 10 },
  { slug: 'womens_clothing',      nameRu: 'Женская одежда',     nameUz: 'Ayollar kiyimi',       parentSlug: 'clothing', level: 1, sortOrder: 20 },
  { slug: 'kids_clothing',        nameRu: 'Детская одежда',     nameUz: 'Bolalar kiyimi',       parentSlug: 'clothing', level: 1, sortOrder: 30 },
  { slug: 'shoes',                nameRu: 'Обувь',              nameUz: 'Poyabzal',             parentSlug: 'clothing', level: 1, sortOrder: 40 },
  { slug: 'fashion_accessories',  nameRu: 'Модные аксессуары',  nameUz: 'Moda aksessuarlari',  parentSlug: 'clothing', level: 1, sortOrder: 50 },

  // ── Level 1 — Automotive ───────────────────────────────────────────────────
  { slug: 'cars',        nameRu: 'Автомобили (новые)',      nameUz: 'Avtomobillar (yangi)',        parentSlug: 'automotive', level: 1, sortOrder: 10 },
  { slug: 'cars_used',   nameRu: 'Автомобили (б/у)',        nameUz: 'Avtomobillar (ishlatilgan)', parentSlug: 'automotive', level: 1, sortOrder: 20 },
  { slug: 'motorcycles', nameRu: 'Мотоциклы',               nameUz: 'Mototsikllar',               parentSlug: 'automotive', level: 1, sortOrder: 30 },

  // ── Level 1 — Furniture ────────────────────────────────────────────────────
  { slug: 'sofa', nameRu: 'Диваны',   nameUz: 'Divanlar',    parentSlug: 'furniture', level: 1, sortOrder: 10 },
  { slug: 'beds', nameRu: 'Кровати',  nameUz: 'Karavotlar',  parentSlug: 'furniture', level: 1, sortOrder: 20 },

  // ── Level 1 — Books ────────────────────────────────────────────────────────
  { slug: 'fiction',      nameRu: 'Художественная литература',    nameUz: 'Badiiy adabiyot',  parentSlug: 'books', level: 1, sortOrder: 10 },
  { slug: 'non_fiction',  nameRu: 'Нехудожественная литература',  nameUz: 'Ommabop adabiyot', parentSlug: 'books', level: 1, sortOrder: 20 },

  // ── Level 1 — Outdoor ─────────────────────────────────────────────────────
  { slug: 'bikes', nameRu: 'Велосипеды', nameUz: 'Velosipedlar', parentSlug: 'outdoor', level: 1, sortOrder: 10 },

  // ── Level 2 ────────────────────────────────────────────────────────────────
  { slug: 'smartphones',    nameRu: 'Смартфоны',         nameUz: 'Smartfonlar', parentSlug: 'phones', level: 2, sortOrder: 10 },
  { slug: 'pc_components',  nameRu: 'Комплектующие ПК',  nameUz: 'PK qismlari', parentSlug: 'pc',     level: 2, sortOrder: 10 },
];

async function main() {
  console.log('🌱 Seeding global_categories...');

  const slugToId = new Map<string, string>();

  // Sort by level to ensure parents exist before children
  const sorted = [...RAW].sort((a, b) => a.level - b.level);

  for (const cat of sorted) {
    const parentId = cat.parentSlug ? slugToId.get(cat.parentSlug) ?? null : null;

    const record = await prisma.globalCategory.upsert({
      where: { slug: cat.slug },
      update: {
        nameRu: cat.nameRu,
        nameUz: cat.nameUz,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        nameRu: cat.nameRu,
        nameUz: cat.nameUz,
        parentId,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });

    slugToId.set(cat.slug, record.id);
    console.log(`  ✅ ${cat.slug} → ${record.id}`);
  }

  console.log(`\n✅ Done — ${sorted.length} categories seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
