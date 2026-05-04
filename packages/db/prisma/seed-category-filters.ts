// Seed CategoryFilter — фильтры для CategoryFilter таблицы по категориям.
// Активирует TMA-DYNAMIC-VARIANT-FILTERS-001: multi_select поля становятся
// вариантами товара (Размер S/M/L/XL для одежды, RAM 8/16/32 для ноутов).
//
// Запуск: pnpm --filter db seed:filters
//
// fieldType хранится в БД UPPERCASE; categories.controller.ts нормализует
// в lowercase перед отдачей фронту.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FilterDef {
  categorySlug: string;
  key: string;
  nameRu: string;
  nameUz: string;
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'COLOR';
  options?: string[];
  unit?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}

const SIZES_CLOTHING = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SIZES_SHOES_EU = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const SIZES_KIDS = ['80', '86', '92', '98', '104', '110', '116', '122', '128', '134', '140'];
const COLORS_BASIC = ['Чёрный', 'Белый', 'Серый', 'Красный', 'Синий', 'Зелёный', 'Жёлтый', 'Розовый', 'Коричневый', 'Бежевый'];
const RAM_OPTIONS = ['4', '8', '16', '32', '64'];
const STORAGE_GB_OPTIONS = ['64', '128', '256', '512', '1024'];

const FILTERS: FilterDef[] = [
  // ── ОДЕЖДА ─────────────────────────────────────────────────────────────
  // Мужская одежда
  { categorySlug: 'mens_clothing', key: 'size',  nameRu: 'Размер', nameUz: 'Razm',  fieldType: 'MULTI_SELECT', options: SIZES_CLOTHING, isRequired: false, isFilterable: true,  sortOrder: 10 },
  { categorySlug: 'mens_clothing', key: 'color', nameRu: 'Цвет',   nameUz: 'Rang',  fieldType: 'MULTI_SELECT', options: COLORS_BASIC,    isRequired: false, isFilterable: true,  sortOrder: 20 },
  { categorySlug: 'mens_clothing', key: 'brand', nameRu: 'Бренд',  nameUz: 'Brend', fieldType: 'TEXT',         isRequired: false, isFilterable: true,  sortOrder: 30 },

  // Женская одежда
  { categorySlug: 'womens_clothing', key: 'size',  nameRu: 'Размер', nameUz: 'Razm',  fieldType: 'MULTI_SELECT', options: SIZES_CLOTHING, isRequired: false, isFilterable: true,  sortOrder: 10 },
  { categorySlug: 'womens_clothing', key: 'color', nameRu: 'Цвет',   nameUz: 'Rang',  fieldType: 'MULTI_SELECT', options: COLORS_BASIC,    isRequired: false, isFilterable: true,  sortOrder: 20 },
  { categorySlug: 'womens_clothing', key: 'brand', nameRu: 'Бренд',  nameUz: 'Brend', fieldType: 'TEXT',         isRequired: false, isFilterable: true,  sortOrder: 30 },

  // Детская одежда
  { categorySlug: 'kids_clothing', key: 'size',  nameRu: 'Размер (рост)', nameUz: 'Razm (bo`y)', fieldType: 'MULTI_SELECT', options: SIZES_KIDS, unit: 'см', isRequired: false, isFilterable: true,  sortOrder: 10 },
  { categorySlug: 'kids_clothing', key: 'color', nameRu: 'Цвет',          nameUz: 'Rang',        fieldType: 'MULTI_SELECT', options: COLORS_BASIC,             isRequired: false, isFilterable: true,  sortOrder: 20 },
  { categorySlug: 'kids_clothing', key: 'brand', nameRu: 'Бренд',         nameUz: 'Brend',       fieldType: 'TEXT',                                            isRequired: false, isFilterable: true,  sortOrder: 30 },

  // ── ОБУВЬ ──────────────────────────────────────────────────────────────
  { categorySlug: 'shoes', key: 'size',  nameRu: 'Размер EU', nameUz: 'EU razmi', fieldType: 'MULTI_SELECT', options: SIZES_SHOES_EU, isRequired: false, isFilterable: true,  sortOrder: 10 },
  { categorySlug: 'shoes', key: 'color', nameRu: 'Цвет',      nameUz: 'Rang',     fieldType: 'MULTI_SELECT', options: COLORS_BASIC,    isRequired: false, isFilterable: true,  sortOrder: 20 },
  { categorySlug: 'shoes', key: 'brand', nameRu: 'Бренд',     nameUz: 'Brend',    fieldType: 'TEXT',                                   isRequired: false, isFilterable: true,  sortOrder: 30 },

  // ── ЭЛЕКТРОНИКА ────────────────────────────────────────────────────────
  // Ноутбуки
  { categorySlug: 'laptops', key: 'brand',     nameRu: 'Бренд',           nameUz: 'Brend',                  fieldType: 'SELECT', options: ['Apple','HP','Dell','Lenovo','ASUS','Acer','MSI','Huawei','Xiaomi','Microsoft','Samsung'], isRequired: false, isFilterable: true, sortOrder: 10 },
  { categorySlug: 'laptops', key: 'ram_gb',    nameRu: 'Оперативная память',nameUz: 'Operativ xotira',      fieldType: 'SELECT', options: RAM_OPTIONS, unit: 'GB', isRequired: false, isFilterable: true, sortOrder: 20 },
  { categorySlug: 'laptops', key: 'storage_gb',nameRu: 'Накопитель',       nameUz: 'Saqlash hajmi',          fieldType: 'SELECT', options: STORAGE_GB_OPTIONS, unit: 'GB', isRequired: false, isFilterable: true, sortOrder: 30 },
  { categorySlug: 'laptops', key: 'screen_in', nameRu: 'Диагональ экрана', nameUz: 'Ekran diagonali',        fieldType: 'NUMBER', unit: 'дюйм', isRequired: false, isFilterable: true, sortOrder: 40 },
  { categorySlug: 'laptops', key: 'color',     nameRu: 'Цвет',             nameUz: 'Rang',                   fieldType: 'MULTI_SELECT', options: COLORS_BASIC, isRequired: false, isFilterable: true, sortOrder: 50 },

  // Телефоны (общая категория)
  { categorySlug: 'phones', key: 'brand',      nameRu: 'Бренд',     nameUz: 'Brend',         fieldType: 'SELECT', options: ['Apple','Samsung','Xiaomi','Honor','Huawei','Realme','POCO','Google','OnePlus','Nokia'], isRequired: false, isFilterable: true, sortOrder: 10 },
  { categorySlug: 'phones', key: 'storage_gb', nameRu: 'Память',    nameUz: 'Xotira',         fieldType: 'MULTI_SELECT', options: STORAGE_GB_OPTIONS, unit: 'GB', isRequired: false, isFilterable: true, sortOrder: 20 },
  { categorySlug: 'phones', key: 'color',      nameRu: 'Цвет',      nameUz: 'Rang',           fieldType: 'MULTI_SELECT', options: COLORS_BASIC, isRequired: false, isFilterable: true, sortOrder: 30 },

  // Смартфоны (subcategory)
  { categorySlug: 'smartphones', key: 'brand',      nameRu: 'Бренд',     nameUz: 'Brend',         fieldType: 'SELECT', options: ['Apple','Samsung','Xiaomi','Honor','Huawei','Realme','POCO','Google','OnePlus','Nokia'], isRequired: false, isFilterable: true, sortOrder: 10 },
  { categorySlug: 'smartphones', key: 'storage_gb', nameRu: 'Память',    nameUz: 'Xotira',         fieldType: 'MULTI_SELECT', options: STORAGE_GB_OPTIONS, unit: 'GB', isRequired: false, isFilterable: true, sortOrder: 20 },
  { categorySlug: 'smartphones', key: 'color',      nameRu: 'Цвет',      nameUz: 'Rang',           fieldType: 'MULTI_SELECT', options: COLORS_BASIC, isRequired: false, isFilterable: true, sortOrder: 30 },

  // Планшеты
  { categorySlug: 'tablets', key: 'brand',      nameRu: 'Бренд',  nameUz: 'Brend',  fieldType: 'SELECT', options: ['Apple','Samsung','Xiaomi','Huawei','Lenovo','Microsoft'], isRequired: false, isFilterable: true, sortOrder: 10 },
  { categorySlug: 'tablets', key: 'storage_gb', nameRu: 'Память', nameUz: 'Xotira',  fieldType: 'MULTI_SELECT', options: STORAGE_GB_OPTIONS, unit: 'GB', isRequired: false, isFilterable: true, sortOrder: 20 },
  { categorySlug: 'tablets', key: 'color',      nameRu: 'Цвет',   nameUz: 'Rang',    fieldType: 'MULTI_SELECT', options: COLORS_BASIC, isRequired: false, isFilterable: true, sortOrder: 30 },

  // Телевизоры
  { categorySlug: 'tv', key: 'brand',     nameRu: 'Бренд',           nameUz: 'Brend',           fieldType: 'SELECT', options: ['Samsung','LG','Sony','Xiaomi','TCL','Hisense','Philips','Artel'], isRequired: false, isFilterable: true, sortOrder: 10 },
  { categorySlug: 'tv', key: 'screen_in', nameRu: 'Диагональ',       nameUz: 'Diagonal',         fieldType: 'NUMBER', unit: 'дюйм', isRequired: false, isFilterable: true, sortOrder: 20 },
  { categorySlug: 'tv', key: 'resolution',nameRu: 'Разрешение',      nameUz: 'Aniqlik',          fieldType: 'SELECT', options: ['HD', 'Full HD', '4K UHD', '8K'], isRequired: false, isFilterable: true, sortOrder: 30 },

  // ── БЫТОВАЯ ТЕХНИКА ────────────────────────────────────────────────────
  { categorySlug: 'refrigerators',    key: 'brand',     nameRu: 'Бренд',         nameUz: 'Brend',           fieldType: 'SELECT', options: ['Samsung','LG','Bosch','Whirlpool','Beko','Indesit','Artel','Atlant','Gorenje'], isRequired: false, isFilterable: true, sortOrder: 10 },
  { categorySlug: 'refrigerators',    key: 'capacity_l',nameRu: 'Объём',          nameUz: 'Hajmi',           fieldType: 'NUMBER', unit: 'л', isRequired: false, isFilterable: true, sortOrder: 20 },
  { categorySlug: 'washing_machines', key: 'brand',     nameRu: 'Бренд',         nameUz: 'Brend',           fieldType: 'SELECT', options: ['Samsung','LG','Bosch','Whirlpool','Beko','Indesit','Artel','Gorenje'], isRequired: false, isFilterable: true, sortOrder: 10 },
  { categorySlug: 'washing_machines', key: 'capacity_kg',nameRu: 'Загрузка',      nameUz: 'Yuklama',          fieldType: 'NUMBER', unit: 'кг', isRequired: false, isFilterable: true, sortOrder: 20 },

  // ── АКСЕССУАРЫ ─────────────────────────────────────────────────────────
  { categorySlug: 'fashion_accessories', key: 'color', nameRu: 'Цвет',   nameUz: 'Rang',  fieldType: 'MULTI_SELECT', options: COLORS_BASIC, isRequired: false, isFilterable: true,  sortOrder: 10 },
  { categorySlug: 'fashion_accessories', key: 'brand', nameRu: 'Бренд',  nameUz: 'Brend', fieldType: 'TEXT',                                  isRequired: false, isFilterable: true,  sortOrder: 20 },
];

async function main() {
  console.log(`🌱 Seeding ${FILTERS.length} category filters...`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const f of FILTERS) {
    // Проверяем что категория существует — иначе orphan-фильтр.
    const cat = await prisma.globalCategory.findUnique({ where: { slug: f.categorySlug } });
    if (!cat) {
      console.warn(`  ⚠️  Skipped ${f.categorySlug}/${f.key}: категория не найдена`);
      skipped++;
      continue;
    }

    const existing = await prisma.categoryFilter.findUnique({
      where: { categorySlug_key: { categorySlug: f.categorySlug, key: f.key } },
    });

    const data = {
      categorySlug: f.categorySlug,
      key: f.key,
      nameRu: f.nameRu,
      nameUz: f.nameUz,
      fieldType: f.fieldType,
      options: f.options ? JSON.stringify(f.options) : null,
      unit: f.unit ?? null,
      isRequired: f.isRequired ?? false,
      isFilterable: f.isFilterable ?? true,
      sortOrder: f.sortOrder ?? 0,
    };

    if (existing) {
      await prisma.categoryFilter.update({
        where: { categorySlug_key: { categorySlug: f.categorySlug, key: f.key } },
        data,
      });
      updated++;
      console.log(`  ✓ updated ${f.categorySlug}/${f.key}`);
    } else {
      await prisma.categoryFilter.create({ data });
      created++;
      console.log(`  ✅ created ${f.categorySlug}/${f.key} (${f.fieldType})`);
    }
  }

  console.log(`\n✅ Done — created ${created}, updated ${updated}, skipped ${skipped}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
