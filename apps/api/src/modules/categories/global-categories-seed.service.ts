import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface SeedCategory {
  slug: string;
  nameRu: string;
  nameUz: string;
  parentSlug: string | null;
  level: number;
  sortOrder: number;
  iconEmoji?: string;
  isLeaf?: boolean; // если не задано — вычислится автоматически (нет детей → leaf)
}

interface SeedFilter {
  categorySlug: string;
  key: string;
  nameRu: string;
  nameUz: string;
  fieldType: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN' | 'COLOR' | 'MULTI_SELECT';
  options?: string[];
  unit?: string;
  sortOrder: number;
  isRequired?: boolean;
  isFilterable?: boolean;
}

const CATEGORIES: SeedCategory[] = [
  // ── Level 0 (root, "Отрасль") ──────────────────────────────────────────────
  { slug: 'electronics',  nameRu: 'Электроника',         nameUz: 'Elektronika',        parentSlug: null, level: 0, sortOrder: 10, iconEmoji: '📱' },
  { slug: 'appliances',   nameRu: 'Бытовая техника',     nameUz: 'Maishiy texnika',    parentSlug: null, level: 0, sortOrder: 20, iconEmoji: '🏠' },
  { slug: 'clothing',     nameRu: 'Одежда',              nameUz: 'Kiyimlar',           parentSlug: null, level: 0, sortOrder: 30, iconEmoji: '👕' },
  { slug: 'beauty',       nameRu: 'Красота и уход',      nameUz: 'Go\'zallik va parvarish', parentSlug: null, level: 0, sortOrder: 40, iconEmoji: '💄' },
  { slug: 'furniture',    nameRu: 'Мебель',              nameUz: 'Mebel',              parentSlug: null, level: 0, sortOrder: 50, iconEmoji: '🛋️' },
  { slug: 'books',        nameRu: 'Книги',               nameUz: 'Kitoblar',           parentSlug: null, level: 0, sortOrder: 60, iconEmoji: '📚' },
  { slug: 'outdoor',      nameRu: 'Спорт и отдых',       nameUz: 'Sport va dam olish', parentSlug: null, level: 0, sortOrder: 70, iconEmoji: '🏃' },
  { slug: 'kids',         nameRu: 'Детям',               nameUz: 'Bolalar uchun',      parentSlug: null, level: 0, sortOrder: 80, iconEmoji: '🧸' },

  // ── Level 1 — Electronics ────────────────────────────────────────────────────
  { slug: 'phones',                 nameRu: 'Телефоны',                nameUz: 'Telefonlar',            parentSlug: 'electronics', level: 1, sortOrder: 10 },
  { slug: 'tablets',                nameRu: 'Планшеты',                nameUz: 'Planshetlar',           parentSlug: 'electronics', level: 1, sortOrder: 20 },
  { slug: 'laptops',                nameRu: 'Ноутбуки',                nameUz: 'Noutbuklar',            parentSlug: 'electronics', level: 1, sortOrder: 30 },
  { slug: 'pc',                     nameRu: 'Персональные компьютеры', nameUz: 'Shaxsiy kompyuterlar',  parentSlug: 'electronics', level: 1, sortOrder: 40 },
  { slug: 'cameras',                nameRu: 'Фотокамеры',              nameUz: 'Fotokameralar',         parentSlug: 'electronics', level: 1, sortOrder: 50 },
  { slug: 'audio',                  nameRu: 'Аудио',                   nameUz: 'Audio',                 parentSlug: 'electronics', level: 1, sortOrder: 60 },
  { slug: 'tv',                     nameRu: 'Телевизоры',              nameUz: 'Televizorlar',          parentSlug: 'electronics', level: 1, sortOrder: 70 },
  { slug: 'electronics_components', nameRu: 'Электронные компоненты',  nameUz: 'Elektron komponentlar', parentSlug: 'electronics', level: 1, sortOrder: 80 },

  // ── Level 1 — Appliances ──────────────────────────────────────────────────────
  { slug: 'kitchen',          nameRu: 'Кухонная техника',     nameUz: 'Oshxona texnikasi',        parentSlug: 'appliances', level: 1, sortOrder: 10 },
  { slug: 'washing_machines', nameRu: 'Стиральные машины',    nameUz: 'Kir yuvish mashinalari',   parentSlug: 'appliances', level: 1, sortOrder: 20 },
  { slug: 'dishes',           nameRu: 'Посудомоечные машины', nameUz: 'Idish yuvish mashinalari', parentSlug: 'appliances', level: 1, sortOrder: 30 },
  { slug: 'refrigerators',    nameRu: 'Холодильники',         nameUz: 'Muzlatgichlar',            parentSlug: 'appliances', level: 1, sortOrder: 40 },

  // ── Level 1 — Clothing ────────────────────────────────────────────────────────
  { slug: 'mens_clothing',       nameRu: 'Мужская одежда',    nameUz: 'Erkaklar kiyimi',    parentSlug: 'clothing', level: 1, sortOrder: 10 },
  { slug: 'womens_clothing',     nameRu: 'Женская одежда',    nameUz: 'Ayollar kiyimi',     parentSlug: 'clothing', level: 1, sortOrder: 20 },
  { slug: 'kids_clothing',       nameRu: 'Детская одежда',    nameUz: 'Bolalar kiyimi',     parentSlug: 'clothing', level: 1, sortOrder: 30 },
  { slug: 'shoes',               nameRu: 'Обувь',             nameUz: 'Poyabzal',           parentSlug: 'clothing', level: 1, sortOrder: 40 },
  { slug: 'fashion_accessories', nameRu: 'Модные аксессуары', nameUz: 'Moda aksessuarlari', parentSlug: 'clothing', level: 1, sortOrder: 50 },

  // automotive level-1 removed

  // ── Level 1 — Furniture ───────────────────────────────────────────────────────
  { slug: 'sofa', nameRu: 'Диваны',  nameUz: 'Divanlar',   parentSlug: 'furniture', level: 1, sortOrder: 10 },
  { slug: 'beds', nameRu: 'Кровати', nameUz: 'Karavotlar', parentSlug: 'furniture', level: 1, sortOrder: 20 },

  // ── Level 1 — Books ───────────────────────────────────────────────────────────
  { slug: 'fiction',     nameRu: 'Художественная литература',   nameUz: 'Badiiy adabiyot',  parentSlug: 'books', level: 1, sortOrder: 10 },
  { slug: 'non_fiction', nameRu: 'Нехудожественная литература', nameUz: 'Ommabop adabiyot', parentSlug: 'books', level: 1, sortOrder: 20 },

  // ── Level 1 — Outdoor ────────────────────────────────────────────────────────
  { slug: 'bikes', nameRu: 'Велосипеды', nameUz: 'Velosipedlar', parentSlug: 'outdoor', level: 1, sortOrder: 10 },

  // ── Level 2 — Electronics leafs ─────────────────────────────────────────────
  { slug: 'smartphones',          nameRu: 'Смартфоны',          nameUz: 'Smartfonlar',         parentSlug: 'phones',  level: 2, sortOrder: 10 },
  { slug: 'feature_phones',       nameRu: 'Кнопочные телефоны', nameUz: 'Tugmali telefonlar',  parentSlug: 'phones',  level: 2, sortOrder: 20 },
  { slug: 'gaming_laptops',       nameRu: 'Игровые ноутбуки',   nameUz: 'O\'yin noutbuklari',  parentSlug: 'laptops', level: 2, sortOrder: 10 },
  { slug: 'business_laptops',     nameRu: 'Офисные ноутбуки',   nameUz: 'Ofis noutbuklari',    parentSlug: 'laptops', level: 2, sortOrder: 20 },
  { slug: 'pc_components',        nameRu: 'Комплектующие ПК',   nameUz: 'PK qismlari',         parentSlug: 'pc',      level: 2, sortOrder: 10 },
  { slug: 'headphones',           nameRu: 'Наушники',           nameUz: 'Naushniklar',         parentSlug: 'audio',   level: 2, sortOrder: 10 },
  { slug: 'speakers',             nameRu: 'Колонки',            nameUz: 'Karnaylar',           parentSlug: 'audio',   level: 2, sortOrder: 20 },

  // ── Level 2 — Appliances leafs ──────────────────────────────────────────────
  { slug: 'microwaves',     nameRu: 'Микроволновки',  nameUz: 'Mikroto\'lqinli pechlar', parentSlug: 'kitchen', level: 2, sortOrder: 10 },
  { slug: 'blenders',       nameRu: 'Блендеры',       nameUz: 'Blenderlar',              parentSlug: 'kitchen', level: 2, sortOrder: 20 },
  { slug: 'kettles',        nameRu: 'Электрочайники', nameUz: 'Elektr choynaklar',       parentSlug: 'kitchen', level: 2, sortOrder: 30 },

  // ── Level 2 — Clothing leafs ───────────────────────────────────────────────
  { slug: 'mens_tshirts',   nameRu: 'Мужские футболки',     nameUz: 'Erkak futbolkalari',  parentSlug: 'mens_clothing',   level: 2, sortOrder: 10 },
  { slug: 'mens_jeans',     nameRu: 'Мужские джинсы',       nameUz: 'Erkak jinslari',      parentSlug: 'mens_clothing',   level: 2, sortOrder: 20 },
  { slug: 'mens_jackets',   nameRu: 'Мужские куртки',       nameUz: 'Erkak kurtkalar',     parentSlug: 'mens_clothing',   level: 2, sortOrder: 30 },
  { slug: 'womens_dresses', nameRu: 'Женские платья',       nameUz: 'Ayol koylaklari',     parentSlug: 'womens_clothing', level: 2, sortOrder: 10 },
  { slug: 'womens_tshirts', nameRu: 'Женские футболки',     nameUz: 'Ayol futbolkalari',   parentSlug: 'womens_clothing', level: 2, sortOrder: 20 },
  { slug: 'womens_jeans',   nameRu: 'Женские джинсы',       nameUz: 'Ayol jinslari',       parentSlug: 'womens_clothing', level: 2, sortOrder: 30 },

  // ── Level 2 — Shoes leafs ──────────────────────────────────────────────────
  { slug: 'sneakers',  nameRu: 'Кроссовки', nameUz: 'Krossovkalar', parentSlug: 'shoes', level: 2, sortOrder: 10 },
  { slug: 'boots',     nameRu: 'Ботинки',   nameUz: 'Botinkalar',   parentSlug: 'shoes', level: 2, sortOrder: 20 },
  { slug: 'casual_shoes', nameRu: 'Туфли',  nameUz: 'Tuflilar',     parentSlug: 'shoes', level: 2, sortOrder: 30 },

  // ── Level 1 — Beauty (новая отрасль) ────────────────────────────────────────
  { slug: 'perfume',           nameRu: 'Парфюмерия',          nameUz: 'Parfyumeriya',         parentSlug: 'beauty', level: 1, sortOrder: 10 },
  { slug: 'face_care',         nameRu: 'Уход за лицом',       nameUz: 'Yuz parvarishi',       parentSlug: 'beauty', level: 1, sortOrder: 20 },
  { slug: 'decorative_makeup', nameRu: 'Декоративная косметика', nameUz: 'Dekorativ kosmetika', parentSlug: 'beauty', level: 1, sortOrder: 30 },

  // ── Level 1 — Kids (новая отрасль) ─────────────────────────────────────────
  { slug: 'toys',         nameRu: 'Игрушки',           nameUz: 'O\'yinchoqlar',         parentSlug: 'kids', level: 1, sortOrder: 10 },
  { slug: 'baby_food',    nameRu: 'Детское питание',   nameUz: 'Bolalar oziq-ovqati',   parentSlug: 'kids', level: 1, sortOrder: 20 },
  { slug: 'baby_clothes', nameRu: 'Одежда для младенцев', nameUz: 'Chaqaloqlar kiyimi', parentSlug: 'kids', level: 1, sortOrder: 30 },
];

const COLORS_RU = ['Чёрный', 'Белый', 'Серый', 'Синий', 'Красный', 'Зелёный', 'Золотой', 'Серебристый', 'Розовый', 'Жёлтый', 'Другой'];
const COLORS_UZ = ['Qora', 'Oq', 'Kulrang', 'Ko\'k', 'Qizil', 'Yashil', 'Oltin', 'Kumush', 'Pushti', 'Sariq', 'Boshqa'];

const CATEGORY_FILTERS: SeedFilter[] = [
  // ── Телефоны / Смартфоны ─────────────────────────────────────────────────────
  { categorySlug: 'phones',       key: 'brand',    nameRu: 'Бренд',     nameUz: 'Brend',   fieldType: 'SELECT', options: ['Apple','Samsung','Xiaomi','Huawei','Realme','OnePlus','Google','Другой'], sortOrder: 10 },
  { categorySlug: 'phones',       key: 'color',    nameRu: 'Цвет',      nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'phones',       key: 'ram',      nameRu: 'ОЗУ',       nameUz: 'RAM',     fieldType: 'SELECT', options: ['4','6','8','12','16'], unit: 'GB', sortOrder: 30 },
  { categorySlug: 'phones',       key: 'storage',  nameRu: 'Память',    nameUz: 'Xotira',  fieldType: 'SELECT', options: ['32','64','128','256','512'], unit: 'GB', sortOrder: 40 },
  { categorySlug: 'phones',       key: 'screen',   nameRu: 'Экран',     nameUz: 'Ekran',   fieldType: 'NUMBER', unit: 'inch', sortOrder: 50 },
  { categorySlug: 'smartphones',  key: 'brand',    nameRu: 'Бренд',     nameUz: 'Brend',   fieldType: 'SELECT', options: ['Apple','Samsung','Xiaomi','Huawei','Realme','OnePlus','Google','Другой'], sortOrder: 10 },
  { categorySlug: 'smartphones',  key: 'color',    nameRu: 'Цвет',      nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'smartphones',  key: 'ram',      nameRu: 'ОЗУ',       nameUz: 'RAM',     fieldType: 'SELECT', options: ['4','6','8','12','16'], unit: 'GB', sortOrder: 30 },
  { categorySlug: 'smartphones',  key: 'storage',  nameRu: 'Память',    nameUz: 'Xotira',  fieldType: 'SELECT', options: ['32','64','128','256','512'], unit: 'GB', sortOrder: 40 },
  { categorySlug: 'smartphones',  key: 'screen',   nameRu: 'Диагональ', nameUz: 'Diagonal',fieldType: 'NUMBER', unit: 'inch', sortOrder: 50 },

  // ── Планшеты ─────────────────────────────────────────────────────────────────
  { categorySlug: 'tablets', key: 'brand',   nameRu: 'Бренд',     nameUz: 'Brend',    fieldType: 'SELECT', options: ['Apple','Samsung','Xiaomi','Huawei','Lenovo','Другой'], sortOrder: 10 },
  { categorySlug: 'tablets', key: 'color',   nameRu: 'Цвет',      nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'tablets', key: 'ram',     nameRu: 'ОЗУ',       nameUz: 'RAM',      fieldType: 'SELECT', options: ['4','6','8','12'], unit: 'GB', sortOrder: 30 },
  { categorySlug: 'tablets', key: 'storage', nameRu: 'Память',    nameUz: 'Xotira',   fieldType: 'SELECT', options: ['64','128','256','512'], unit: 'GB', sortOrder: 40 },
  { categorySlug: 'tablets', key: 'screen',  nameRu: 'Диагональ', nameUz: 'Diagonal', fieldType: 'NUMBER', unit: 'inch', sortOrder: 50 },

  // ── Ноутбуки ─────────────────────────────────────────────────────────────────
  { categorySlug: 'laptops', key: 'brand',   nameRu: 'Бренд',       nameUz: 'Brend',    fieldType: 'SELECT', options: ['Apple','Asus','Lenovo','HP','Dell','MSI','Acer','Другой'], sortOrder: 10 },
  { categorySlug: 'laptops', key: 'color',   nameRu: 'Цвет',        nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'laptops', key: 'ram',     nameRu: 'ОЗУ',         nameUz: 'RAM',      fieldType: 'SELECT', options: ['8','16','32','64'], unit: 'GB', sortOrder: 30 },
  { categorySlug: 'laptops', key: 'storage', nameRu: 'Накопитель',  nameUz: 'Xotira',   fieldType: 'SELECT', options: ['256GB','512GB','1TB','2TB'], sortOrder: 40 },
  { categorySlug: 'laptops', key: 'cpu',     nameRu: 'Процессор',   nameUz: 'Protsessor',fieldType: 'SELECT', options: ['Intel Core i3','Intel Core i5','Intel Core i7','Intel Core i9','AMD Ryzen 5','AMD Ryzen 7','Apple M1','Apple M2','Apple M3'], sortOrder: 50 },
  { categorySlug: 'laptops', key: 'screen',  nameRu: 'Диагональ',   nameUz: 'Diagonal', fieldType: 'SELECT', options: ['13','14','15.6','16','17.3'], unit: 'inch', sortOrder: 60 },

  // ── ПК ──────────────────────────────────────────────────────────────────────
  { categorySlug: 'pc',           key: 'brand',   nameRu: 'Бренд',      nameUz: 'Brend',     fieldType: 'SELECT', options: ['Apple','Asus','Lenovo','HP','Dell','Другой'], sortOrder: 10 },
  { categorySlug: 'pc',           key: 'ram',     nameRu: 'ОЗУ',        nameUz: 'RAM',       fieldType: 'SELECT', options: ['8','16','32','64'], unit: 'GB', sortOrder: 20 },
  { categorySlug: 'pc',           key: 'storage', nameRu: 'Накопитель', nameUz: 'Xotira',    fieldType: 'SELECT', options: ['256GB','512GB','1TB','2TB'], sortOrder: 30 },
  { categorySlug: 'pc',           key: 'cpu',     nameRu: 'Процессор',  nameUz: 'Protsessor',fieldType: 'SELECT', options: ['Intel Core i3','Intel Core i5','Intel Core i7','Intel Core i9','AMD Ryzen 5','AMD Ryzen 7'], sortOrder: 40 },
  { categorySlug: 'pc_components',key: 'type',    nameRu: 'Тип',        nameUz: 'Turi',      fieldType: 'SELECT', options: ['Видеокарта','Процессор','Материнская плата','ОЗУ','SSD','HDD','Блок питания','Корпус'], sortOrder: 10 },
  { categorySlug: 'pc_components',key: 'brand',   nameRu: 'Бренд',      nameUz: 'Brend',     fieldType: 'TEXT',   sortOrder: 20 },

  // ── Фотокамеры ───────────────────────────────────────────────────────────────
  { categorySlug: 'cameras', key: 'brand',  nameRu: 'Бренд',        nameUz: 'Brend',   fieldType: 'SELECT', options: ['Canon','Nikon','Sony','Fujifilm','Olympus','Другой'], sortOrder: 10 },
  { categorySlug: 'cameras', key: 'color',  nameRu: 'Цвет',         nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'cameras', key: 'type',   nameRu: 'Тип',          nameUz: 'Turi',    fieldType: 'SELECT', options: ['Зеркальный','Беззеркальный','Компактный','Экшн-камера'], sortOrder: 30 },
  { categorySlug: 'cameras', key: 'mp',     nameRu: 'Мегапикселей', nameUz: 'Megapiksel',fieldType: 'NUMBER', unit: 'MP', sortOrder: 40 },

  // ── Аудио ────────────────────────────────────────────────────────────────────
  { categorySlug: 'audio', key: 'brand',    nameRu: 'Бренд',         nameUz: 'Brend',   fieldType: 'SELECT', options: ['Sony','JBL','Bose','Apple','Samsung','Xiaomi','Другой'], sortOrder: 10 },
  { categorySlug: 'audio', key: 'color',    nameRu: 'Цвет',          nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'audio', key: 'type',     nameRu: 'Тип',           nameUz: 'Turi',    fieldType: 'SELECT', options: ['Наушники','Колонка','Гарнитура','Soundbar'], sortOrder: 30 },
  { categorySlug: 'audio', key: 'wireless', nameRu: 'Беспроводной',  nameUz: 'Simsiz',  fieldType: 'BOOLEAN', sortOrder: 40 },

  // ── Телевизоры ───────────────────────────────────────────────────────────────
  { categorySlug: 'tv', key: 'brand',      nameRu: 'Бренд',      nameUz: 'Brend',    fieldType: 'SELECT', options: ['Samsung','LG','Sony','Hisense','TCL','Xiaomi','Другой'], sortOrder: 10 },
  { categorySlug: 'tv', key: 'color',      nameRu: 'Цвет',       nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'tv', key: 'screen',     nameRu: 'Диагональ',  nameUz: 'Diagonal', fieldType: 'SELECT', options: ['32','40','43','50','55','65','75'], unit: 'inch', sortOrder: 30 },
  { categorySlug: 'tv', key: 'resolution', nameRu: 'Разрешение', nameUz: 'Ruxsat',   fieldType: 'SELECT', options: ['HD','Full HD','4K UHD','8K'], sortOrder: 40 },
  { categorySlug: 'tv', key: 'smart',      nameRu: 'Smart TV',   nameUz: 'Smart TV', fieldType: 'BOOLEAN', sortOrder: 50 },

  // ── Кухонная техника ─────────────────────────────────────────────────────────
  { categorySlug: 'kitchen', key: 'brand', nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['Bosch','Philips','Braun','Tefal','Moulinex','Midea','Другой'], sortOrder: 10 },
  { categorySlug: 'kitchen', key: 'color', nameRu: 'Цвет',  nameUz: 'Rang',  fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'kitchen', key: 'type',  nameRu: 'Тип',   nameUz: 'Turi',  fieldType: 'SELECT', options: ['Микроволновка','Духовка','Чайник','Блендер','Кофеварка','Тостер','Мультиварка','Другой'], sortOrder: 30 },

  // ── Стиральные машины ────────────────────────────────────────────────────────
  { categorySlug: 'washing_machines', key: 'brand', nameRu: 'Бренд',    nameUz: 'Brend',   fieldType: 'SELECT', options: ['Bosch','Samsung','LG','Ariston','Indesit','Haier','Другой'], sortOrder: 10 },
  { categorySlug: 'washing_machines', key: 'color', nameRu: 'Цвет',     nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'washing_machines', key: 'load',  nameRu: 'Загрузка', nameUz: 'Sig\'im', fieldType: 'SELECT', options: ['5','6','7','8','9','10'], unit: 'кг', sortOrder: 30 },

  // ── Посудомоечные машины ─────────────────────────────────────────────────────
  { categorySlug: 'dishes', key: 'brand',   nameRu: 'Бренд',          nameUz: 'Brend',   fieldType: 'SELECT', options: ['Bosch','Siemens','Electrolux','Indesit','Другой'], sortOrder: 10 },
  { categorySlug: 'dishes', key: 'color',   nameRu: 'Цвет',           nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'dishes', key: 'sets',    nameRu: 'Число комплектов',nameUz: 'To\'plamlar soni', fieldType: 'SELECT', options: ['6','9','12','14'], sortOrder: 30 },

  // ── Холодильники ─────────────────────────────────────────────────────────────
  { categorySlug: 'refrigerators', key: 'brand',  nameRu: 'Бренд',  nameUz: 'Brend',   fieldType: 'SELECT', options: ['Samsung','LG','Bosch','Atlant','Haier','Midea','Другой'], sortOrder: 10 },
  { categorySlug: 'refrigerators', key: 'color',  nameRu: 'Цвет',   nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'refrigerators', key: 'volume', nameRu: 'Объём',  nameUz: 'Hajm',    fieldType: 'NUMBER', unit: 'л', sortOrder: 30 },

  // ── Мужская одежда ───────────────────────────────────────────────────────────
  { categorySlug: 'mens_clothing', key: 'brand',    nameRu: 'Бренд',    nameUz: 'Brend',    fieldType: 'TEXT', sortOrder: 10 },
  { categorySlug: 'mens_clothing', key: 'size',     nameRu: 'Размер',   nameUz: 'O\'lcham', fieldType: 'SELECT', options: ['XS','S','M','L','XL','XXL','3XL'], sortOrder: 20 },
  { categorySlug: 'mens_clothing', key: 'color',    nameRu: 'Цвет',     nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 30 },
  { categorySlug: 'mens_clothing', key: 'material', nameRu: 'Материал', nameUz: 'Material', fieldType: 'SELECT', options: ['Хлопок','Полиэстер','Лён','Шерсть','Кожа','Другой'], sortOrder: 40 },
  { categorySlug: 'mens_clothing', key: 'season',   nameRu: 'Сезон',    nameUz: 'Fasl',     fieldType: 'SELECT', options: ['Весна/Осень','Лето','Зима','Всесезонная'], sortOrder: 50 },

  // ── Женская одежда ───────────────────────────────────────────────────────────
  { categorySlug: 'womens_clothing', key: 'brand',    nameRu: 'Бренд',    nameUz: 'Brend',    fieldType: 'TEXT', sortOrder: 10 },
  { categorySlug: 'womens_clothing', key: 'size',     nameRu: 'Размер',   nameUz: 'O\'lcham', fieldType: 'SELECT', options: ['XS','S','M','L','XL','XXL'], sortOrder: 20 },
  { categorySlug: 'womens_clothing', key: 'color',    nameRu: 'Цвет',     nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 30 },
  { categorySlug: 'womens_clothing', key: 'material', nameRu: 'Материал', nameUz: 'Material', fieldType: 'SELECT', options: ['Хлопок','Шёлк','Полиэстер','Лён','Другой'], sortOrder: 40 },
  { categorySlug: 'womens_clothing', key: 'season',   nameRu: 'Сезон',    nameUz: 'Fasl',     fieldType: 'SELECT', options: ['Весна/Осень','Лето','Зима','Всесезонная'], sortOrder: 50 },

  // ── Детская одежда ───────────────────────────────────────────────────────────
  { categorySlug: 'kids_clothing', key: 'brand',    nameRu: 'Бренд',    nameUz: 'Brend',    fieldType: 'TEXT', sortOrder: 10 },
  { categorySlug: 'kids_clothing', key: 'age',      nameRu: 'Возраст',  nameUz: 'Yosh',     fieldType: 'SELECT', options: ['0-1','1-2','2-3','3-4','4-5','5-6','6-8','8-10','10-12','12-14'], unit: 'лет', sortOrder: 20 },
  { categorySlug: 'kids_clothing', key: 'size',     nameRu: 'Размер',   nameUz: 'O\'lcham', fieldType: 'SELECT', options: ['56','62','68','74','80','86','92','98','104','110','116','122','128','134','140'], sortOrder: 30 },
  { categorySlug: 'kids_clothing', key: 'color',    nameRu: 'Цвет',     nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 40 },
  { categorySlug: 'kids_clothing', key: 'material', nameRu: 'Материал', nameUz: 'Material', fieldType: 'SELECT', options: ['Хлопок','Полиэстер','Другой'], sortOrder: 50 },

  // ── Обувь ─────────────────────────────────────────────────────────────────────
  { categorySlug: 'shoes', key: 'brand',    nameRu: 'Бренд',    nameUz: 'Brend',    fieldType: 'TEXT', sortOrder: 10 },
  { categorySlug: 'shoes', key: 'size',     nameRu: 'Размер EU',nameUz: 'EU o\'lcham',fieldType: 'SELECT', options: ['35','36','37','38','39','40','41','42','43','44','45','46'], sortOrder: 20 },
  { categorySlug: 'shoes', key: 'color',    nameRu: 'Цвет',     nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 30 },
  { categorySlug: 'shoes', key: 'material', nameRu: 'Материал', nameUz: 'Material', fieldType: 'SELECT', options: ['Натуральная кожа','Искусственная кожа','Текстиль','Замша','Другой'], sortOrder: 40 },
  { categorySlug: 'shoes', key: 'gender',   nameRu: 'Пол',      nameUz: 'Jins',     fieldType: 'SELECT', options: ['Мужской','Женский','Унисекс','Детский'], sortOrder: 50 },
  { categorySlug: 'shoes', key: 'season',   nameRu: 'Сезон',    nameUz: 'Fasl',     fieldType: 'SELECT', options: ['Весна/Осень','Лето','Зима','Всесезонная'], sortOrder: 60 },

  // ── Модные аксессуары ────────────────────────────────────────────────────────
  { categorySlug: 'fashion_accessories', key: 'brand', nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'TEXT', sortOrder: 10 },
  { categorySlug: 'fashion_accessories', key: 'color', nameRu: 'Цвет',  nameUz: 'Rang',  fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'fashion_accessories', key: 'type',  nameRu: 'Тип',   nameUz: 'Turi',  fieldType: 'SELECT', options: ['Сумка','Ремень','Часы','Кошелёк','Шарф','Шляпа','Очки','Ювелирные украшения','Другой'], sortOrder: 30 },

  // automotive filters removed

  // ── Диваны ───────────────────────────────────────────────────────────────────
  { categorySlug: 'sofa', key: 'color',      nameRu: 'Цвет',       nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 10 },
  { categorySlug: 'sofa', key: 'material',   nameRu: 'Материал',   nameUz: 'Material',fieldType: 'SELECT', options: ['Ткань','Кожа','Экокожа','Велюр','Другой'], sortOrder: 20 },
  { categorySlug: 'sofa', key: 'foldable',   nameRu: 'Раскладной', nameUz: 'Ochiluvchi',fieldType: 'BOOLEAN', sortOrder: 30 },
  { categorySlug: 'sofa', key: 'seats',      nameRu: 'Мест',       nameUz: 'O\'rindiq',fieldType: 'SELECT', options: ['2','3','4','5','6'], sortOrder: 40 },

  // ── Кровати ───────────────────────────────────────────────────────────────────
  { categorySlug: 'beds', key: 'size',       nameRu: 'Размер',     nameUz: 'O\'lcham', fieldType: 'SELECT', options: ['Односпальная 90×200','Полутораспальная 120×200','Двуспальная 160×200','King 180×200','Super King 200×200'], sortOrder: 10 },
  { categorySlug: 'beds', key: 'color',      nameRu: 'Цвет',       nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 20 },
  { categorySlug: 'beds', key: 'material',   nameRu: 'Материал',   nameUz: 'Material', fieldType: 'SELECT', options: ['Дерево','МДФ','Металл','Ткань','Кожа'], sortOrder: 30 },
  { categorySlug: 'beds', key: 'storage',    nameRu: 'С ящиком',   nameUz: 'Tortma bilan', fieldType: 'BOOLEAN', sortOrder: 40 },

  // ── Книги ─────────────────────────────────────────────────────────────────────
  { categorySlug: 'fiction',     key: 'author',   nameRu: 'Автор',       nameUz: 'Muallif', fieldType: 'TEXT', sortOrder: 10 },
  { categorySlug: 'fiction',     key: 'genre',    nameRu: 'Жанр',        nameUz: 'Janr',    fieldType: 'SELECT', options: ['Роман','Детектив','Фантастика','Фэнтези','Триллер','Ужасы','Исторический','Другой'], sortOrder: 20 },
  { categorySlug: 'fiction',     key: 'language', nameRu: 'Язык',        nameUz: 'Til',     fieldType: 'SELECT', options: ['Русский','Узбекский','Английский','Другой'], sortOrder: 30 },
  { categorySlug: 'fiction',     key: 'year',     nameRu: 'Год издания', nameUz: 'Nashr yili',fieldType: 'NUMBER', sortOrder: 40 },
  { categorySlug: 'non_fiction', key: 'author',   nameRu: 'Автор',       nameUz: 'Muallif', fieldType: 'TEXT', sortOrder: 10 },
  { categorySlug: 'non_fiction', key: 'genre',    nameRu: 'Тема',        nameUz: 'Mavzu',   fieldType: 'SELECT', options: ['Бизнес','Психология','История','Наука','Саморазвитие','Биография','Кулинария','Другой'], sortOrder: 20 },
  { categorySlug: 'non_fiction', key: 'language', nameRu: 'Язык',        nameUz: 'Til',     fieldType: 'SELECT', options: ['Русский','Узбекский','Английский','Другой'], sortOrder: 30 },
  { categorySlug: 'non_fiction', key: 'year',     nameRu: 'Год издания', nameUz: 'Nashr yili',fieldType: 'NUMBER', sortOrder: 40 },

  // ── Велосипеды ───────────────────────────────────────────────────────────────
  { categorySlug: 'bikes', key: 'brand',  nameRu: 'Бренд',    nameUz: 'Brend',    fieldType: 'SELECT', options: ['Trek','Giant','Merida','Stels','Другой'], sortOrder: 10 },
  { categorySlug: 'bikes', key: 'type',   nameRu: 'Тип',      nameUz: 'Turi',     fieldType: 'SELECT', options: ['Горный','Дорожный','Складной','BMX','Детский'], sortOrder: 20 },
  { categorySlug: 'bikes', key: 'color',  nameRu: 'Цвет',     nameUz: 'Rang',     fieldType: 'SELECT', options: COLORS_RU, sortOrder: 30 },
  { categorySlug: 'bikes', key: 'frame',  nameRu: 'Рама',     nameUz: 'Rama',     fieldType: 'SELECT', options: ['13','15','17','19','21'], unit: 'дюйм', sortOrder: 40 },
  { categorySlug: 'bikes', key: 'wheels', nameRu: 'Колёса',   nameUz: 'G\'ildirak',fieldType: 'SELECT', options: ['20','24','26','27.5','28','29'], unit: 'дюйм', sortOrder: 50 },

  // ── Игровые ноутбуки ─────────────────────────────────────────────────────
  { categorySlug: 'gaming_laptops', key: 'brand', nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['ASUS','MSI','Acer','Lenovo','HP','Dell','Apple'], sortOrder: 10, isRequired: true },
  { categorySlug: 'gaming_laptops', key: 'cpu',   nameRu: 'Процессор', nameUz: 'Protsessor', fieldType: 'SELECT', options: ['Intel Core i5','Intel Core i7','Intel Core i9','AMD Ryzen 5','AMD Ryzen 7','AMD Ryzen 9'], sortOrder: 20, isRequired: true },
  { categorySlug: 'gaming_laptops', key: 'ram',   nameRu: 'ОЗУ', nameUz: 'RAM', fieldType: 'SELECT', options: ['8','16','32','64'], unit: 'GB', sortOrder: 30, isRequired: true },
  { categorySlug: 'gaming_laptops', key: 'ssd',   nameRu: 'SSD', nameUz: 'SSD', fieldType: 'SELECT', options: ['256','512','1024','2048'], unit: 'GB', sortOrder: 40 },
  { categorySlug: 'gaming_laptops', key: 'gpu',   nameRu: 'Видеокарта', nameUz: 'Videokarta', fieldType: 'SELECT', options: ['RTX 3050','RTX 3060','RTX 3070','RTX 3080','RTX 4060','RTX 4070','RTX 4080','RTX 4090','Radeon RX'], sortOrder: 50, isRequired: true },
  { categorySlug: 'gaming_laptops', key: 'screen',nameRu: 'Диагональ', nameUz: 'Diagonal', fieldType: 'SELECT', options: ['14','15.6','16','17.3'], unit: 'inch', sortOrder: 60 },

  // ── Office laptops ─────────────────────────────────────────────────────────
  { categorySlug: 'business_laptops', key: 'brand', nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['Apple','Lenovo','HP','Dell','ASUS','Acer','Huawei'], sortOrder: 10, isRequired: true },
  { categorySlug: 'business_laptops', key: 'ram',   nameRu: 'ОЗУ', nameUz: 'RAM', fieldType: 'SELECT', options: ['4','8','16','32'], unit: 'GB', sortOrder: 20, isRequired: true },
  { categorySlug: 'business_laptops', key: 'ssd',   nameRu: 'SSD', nameUz: 'SSD', fieldType: 'SELECT', options: ['128','256','512','1024'], unit: 'GB', sortOrder: 30 },
  { categorySlug: 'business_laptops', key: 'screen',nameRu: 'Диагональ', nameUz: 'Diagonal', fieldType: 'SELECT', options: ['13','13.3','14','15.6','16'], unit: 'inch', sortOrder: 40 },

  // ── Headphones ─────────────────────────────────────────────────────────────
  { categorySlug: 'headphones', key: 'brand',    nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['Apple','Sony','Bose','JBL','Samsung','Xiaomi','Marshall','Beats'], sortOrder: 10, isRequired: true },
  { categorySlug: 'headphones', key: 'type',     nameRu: 'Тип', nameUz: 'Turi', fieldType: 'SELECT', options: ['Накладные','Внутриканальные','Полноразмерные'], sortOrder: 20, isRequired: true },
  { categorySlug: 'headphones', key: 'wireless', nameRu: 'Беспроводные', nameUz: 'Simsiz', fieldType: 'BOOLEAN', sortOrder: 30 },
  { categorySlug: 'headphones', key: 'anc',      nameRu: 'Шумоподавление', nameUz: 'Shovqin bostirish', fieldType: 'BOOLEAN', sortOrder: 40 },
  { categorySlug: 'headphones', key: 'color',    nameRu: 'Цвет', nameUz: 'Rang', fieldType: 'SELECT', options: COLORS_RU, sortOrder: 50 },

  // ── Speakers ────────────────────────────────────────────────────────────────
  { categorySlug: 'speakers', key: 'brand',    nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['JBL','Sony','Bose','Marshall','Xiaomi','Harman Kardon','Другой'], sortOrder: 10, isRequired: true },
  { categorySlug: 'speakers', key: 'power',    nameRu: 'Мощность', nameUz: 'Quvvat', fieldType: 'NUMBER', unit: 'W', sortOrder: 20 },
  { categorySlug: 'speakers', key: 'wireless', nameRu: 'Беспроводная', nameUz: 'Simsiz', fieldType: 'BOOLEAN', sortOrder: 30 },

  // ── Microwaves ──────────────────────────────────────────────────────────────
  { categorySlug: 'microwaves', key: 'brand',  nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['Samsung','LG','Bosch','Panasonic','Midea','Другой'], sortOrder: 10 },
  { categorySlug: 'microwaves', key: 'volume', nameRu: 'Объём', nameUz: 'Hajm', fieldType: 'NUMBER', unit: 'L', sortOrder: 20 },
  { categorySlug: 'microwaves', key: 'power',  nameRu: 'Мощность', nameUz: 'Quvvat', fieldType: 'NUMBER', unit: 'W', sortOrder: 30 },
  { categorySlug: 'microwaves', key: 'grill',  nameRu: 'Гриль', nameUz: 'Grill', fieldType: 'BOOLEAN', sortOrder: 40 },

  // ── Refrigerators ──────────────────────────────────────────────────────────
  { categorySlug: 'refrigerators', key: 'brand',    nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['Samsung','LG','Bosch','Indesit','Beko','Atlant','Другой'], sortOrder: 10, isRequired: true },
  { categorySlug: 'refrigerators', key: 'volume',   nameRu: 'Общий объём', nameUz: 'Umumiy hajm', fieldType: 'NUMBER', unit: 'L', sortOrder: 20 },
  { categorySlug: 'refrigerators', key: 'no_frost', nameRu: 'No Frost', nameUz: 'No Frost', fieldType: 'BOOLEAN', sortOrder: 30 },
  { categorySlug: 'refrigerators', key: 'inverter', nameRu: 'Инверторный компрессор', nameUz: 'Inverter kompressor', fieldType: 'BOOLEAN', sortOrder: 40 },
  { categorySlug: 'refrigerators', key: 'color',    nameRu: 'Цвет', nameUz: 'Rang', fieldType: 'SELECT', options: COLORS_RU, sortOrder: 50 },

  // ── Mens T-shirts ─────────────────────────────────────────────────────────
  { categorySlug: 'mens_tshirts', key: 'size',     nameRu: 'Размер', nameUz: 'O\'lcham', fieldType: 'SELECT', options: ['XS','S','M','L','XL','XXL','XXXL'], sortOrder: 10, isRequired: true },
  { categorySlug: 'mens_tshirts', key: 'material', nameRu: 'Материал', nameUz: 'Material', fieldType: 'SELECT', options: ['Хлопок','Полиэстер','Хлопок+Полиэстер','Лён','Шерсть'], sortOrder: 20 },
  { categorySlug: 'mens_tshirts', key: 'color',    nameRu: 'Цвет', nameUz: 'Rang', fieldType: 'SELECT', options: COLORS_RU, sortOrder: 30, isRequired: true },
  { categorySlug: 'mens_tshirts', key: 'sleeve',   nameRu: 'Рукав', nameUz: 'Yeng', fieldType: 'SELECT', options: ['Короткий','Длинный','Без рукавов'], sortOrder: 40 },

  // ── Mens Jeans ─────────────────────────────────────────────────────────────
  { categorySlug: 'mens_jeans', key: 'waist_size', nameRu: 'Размер талии', nameUz: 'Bel o\'lchami', fieldType: 'SELECT', options: ['28','30','32','34','36','38','40','42'], sortOrder: 10, isRequired: true },
  { categorySlug: 'mens_jeans', key: 'length',     nameRu: 'Длина по ноге', nameUz: 'Oyoq uzunligi', fieldType: 'SELECT', options: ['30','32','34','36'], sortOrder: 20 },
  { categorySlug: 'mens_jeans', key: 'fit',        nameRu: 'Посадка', nameUz: 'O\'rnashuv', fieldType: 'SELECT', options: ['Skinny','Slim','Regular','Relaxed','Wide'], sortOrder: 30 },
  { categorySlug: 'mens_jeans', key: 'color',      nameRu: 'Цвет деним', nameUz: 'Denim rangi', fieldType: 'SELECT', options: ['Тёмно-синий','Светло-синий','Чёрный','Серый','Белый','Цветной'], sortOrder: 40 },

  // ── Womens Dresses ────────────────────────────────────────────────────────
  { categorySlug: 'womens_dresses', key: 'size',     nameRu: 'Размер', nameUz: 'O\'lcham', fieldType: 'SELECT', options: ['XS','S','M','L','XL','XXL'], sortOrder: 10, isRequired: true },
  { categorySlug: 'womens_dresses', key: 'length',   nameRu: 'Длина', nameUz: 'Uzunlik', fieldType: 'SELECT', options: ['Мини','Миди','Макси'], sortOrder: 20 },
  { categorySlug: 'womens_dresses', key: 'material', nameRu: 'Материал', nameUz: 'Material', fieldType: 'SELECT', options: ['Хлопок','Шёлк','Полиэстер','Шифон','Атлас','Другой'], sortOrder: 30 },
  { categorySlug: 'womens_dresses', key: 'color',    nameRu: 'Цвет', nameUz: 'Rang', fieldType: 'SELECT', options: COLORS_RU, sortOrder: 40, isRequired: true },
  { categorySlug: 'womens_dresses', key: 'occasion', nameRu: 'Повод', nameUz: 'Holat', fieldType: 'SELECT', options: ['Повседневное','Вечернее','Свадебное','Деловое','Спорт'], sortOrder: 50 },

  // ── Sneakers ───────────────────────────────────────────────────────────────
  { categorySlug: 'sneakers', key: 'size_eu',   nameRu: 'Размер EU', nameUz: 'EU o\'lcham', fieldType: 'SELECT', options: ['35','36','37','38','39','40','41','42','43','44','45','46'], sortOrder: 10, isRequired: true },
  { categorySlug: 'sneakers', key: 'gender',    nameRu: 'Пол', nameUz: 'Jins', fieldType: 'SELECT', options: ['Мужские','Женские','Унисекс','Детские'], sortOrder: 20, isRequired: true },
  { categorySlug: 'sneakers', key: 'brand',     nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['Nike','Adidas','Puma','New Balance','Reebok','Converse','Vans','ASICS','Другой'], sortOrder: 30 },
  { categorySlug: 'sneakers', key: 'color',     nameRu: 'Цвет', nameUz: 'Rang', fieldType: 'SELECT', options: COLORS_RU, sortOrder: 40, isRequired: true },
  { categorySlug: 'sneakers', key: 'season',    nameRu: 'Сезон', nameUz: 'Mavsum', fieldType: 'SELECT', options: ['Лето','Демисезон','Зима','Всесезонный'], sortOrder: 50 },

  // ── Boots ──────────────────────────────────────────────────────────────────
  { categorySlug: 'boots', key: 'size_eu',   nameRu: 'Размер EU', nameUz: 'EU o\'lcham', fieldType: 'SELECT', options: ['35','36','37','38','39','40','41','42','43','44','45','46'], sortOrder: 10, isRequired: true },
  { categorySlug: 'boots', key: 'gender',    nameRu: 'Пол', nameUz: 'Jins', fieldType: 'SELECT', options: ['Мужские','Женские','Унисекс'], sortOrder: 20, isRequired: true },
  { categorySlug: 'boots', key: 'material',  nameRu: 'Материал', nameUz: 'Material', fieldType: 'SELECT', options: ['Кожа','Замша','Текстиль','Эко-кожа'], sortOrder: 30 },
  { categorySlug: 'boots', key: 'season',    nameRu: 'Сезон', nameUz: 'Mavsum', fieldType: 'SELECT', options: ['Зима','Демисезон','Утеплённые'], sortOrder: 40 },
  { categorySlug: 'boots', key: 'waterproof',nameRu: 'Водозащита', nameUz: 'Suv o\'tkazmaslik', fieldType: 'BOOLEAN', sortOrder: 50 },

  // ── Perfume ────────────────────────────────────────────────────────────────
  { categorySlug: 'perfume', key: 'brand',  nameRu: 'Бренд', nameUz: 'Brend', fieldType: 'SELECT', options: ['Chanel','Dior','Tom Ford','Gucci','Armani','Versace','Yves Saint Laurent','Другой'], sortOrder: 10 },
  { categorySlug: 'perfume', key: 'volume', nameRu: 'Объём', nameUz: 'Hajm', fieldType: 'SELECT', options: ['30','50','75','100','125'], unit: 'ml', sortOrder: 20, isRequired: true },
  { categorySlug: 'perfume', key: 'type',   nameRu: 'Тип', nameUz: 'Turi', fieldType: 'SELECT', options: ['EDP (Eau de Parfum)','EDT (Eau de Toilette)','Parfum','Cologne'], sortOrder: 30 },
  { categorySlug: 'perfume', key: 'gender', nameRu: 'Пол', nameUz: 'Jins', fieldType: 'SELECT', options: ['Женский','Мужской','Унисекс'], sortOrder: 40, isRequired: true },

  // ── Toys ───────────────────────────────────────────────────────────────────
  { categorySlug: 'toys', key: 'age_from', nameRu: 'Возраст от', nameUz: 'Yoshdan', fieldType: 'SELECT', options: ['0','1','3','5','7','10','12','14'], unit: 'лет', sortOrder: 10 },
  { categorySlug: 'toys', key: 'age_to',   nameRu: 'Возраст до', nameUz: 'Yoshgacha', fieldType: 'SELECT', options: ['1','3','5','7','10','12','14','18'], unit: 'лет', sortOrder: 20 },
  { categorySlug: 'toys', key: 'type',     nameRu: 'Тип', nameUz: 'Turi', fieldType: 'SELECT', options: ['Конструкторы','Куклы','Машинки','Мягкие','Развивающие','Настольные','Другое'], sortOrder: 30 },
];

@Injectable()
export class GlobalCategoriesSeedService implements OnModuleInit {
  private readonly logger = new Logger(GlobalCategoriesSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.cleanupRemovedCategories();
    await this.seedCategories();
    await this.seedFilters();
  }

  async cleanupRemovedCategories(): Promise<void> {
    const removedSlugs = ['cars', 'cars_used', 'motorcycles', 'automotive'];
    await this.prisma.categoryFilter.deleteMany({
      where: { categorySlug: { in: removedSlugs } },
    });
    // detach products before deleting categories
    await this.prisma.product.updateMany({
      where: { globalCategory: { slug: { in: removedSlugs } } },
      data: { globalCategoryId: null },
    });
    await this.prisma.globalCategory.deleteMany({
      where: { slug: { in: removedSlugs } },
    });
  }

  async seedCategories(): Promise<number> {
    const slugToId = new Map<string, string>();
    const sorted = [...CATEGORIES].sort((a, b) => a.level - b.level);

    // Pre-compute "has children" чтобы решить isLeaf автоматически
    const hasChildren = new Set<string>();
    for (const cat of sorted) if (cat.parentSlug) hasChildren.add(cat.parentSlug);

    for (const cat of sorted) {
      const parentId = cat.parentSlug ? (slugToId.get(cat.parentSlug) ?? null) : null;
      const isLeaf = cat.isLeaf ?? !hasChildren.has(cat.slug);
      const data = {
        slug: cat.slug,
        nameRu: cat.nameRu,
        nameUz: cat.nameUz,
        sortOrder: cat.sortOrder,
        level: cat.level,
        isLeaf,
        iconEmoji: cat.iconEmoji ?? null,
        isActive: true,
      };
      const record = await this.prisma.globalCategory.upsert({
        where: { slug: cat.slug },
        update: data,
        create: { ...data, parentId },
      });
      slugToId.set(cat.slug, record.id);
    }

    this.logger.log(`Upserted ${sorted.length} global categories`);
    return sorted.length;
  }

  async seedFilters(): Promise<number> {
    for (const f of CATEGORY_FILTERS) {
      const data = {
        nameRu: f.nameRu,
        nameUz: f.nameUz,
        fieldType: f.fieldType,
        options: f.options ? JSON.stringify(f.options) : null,
        unit: f.unit ?? null,
        sortOrder: f.sortOrder,
        isRequired: f.isRequired ?? false,
        isFilterable: f.isFilterable ?? true,
      };
      await this.prisma.categoryFilter.upsert({
        where: { categorySlug_key: { categorySlug: f.categorySlug, key: f.key } },
        update: data,
        create: { categorySlug: f.categorySlug, key: f.key, ...data },
      });
    }

    this.logger.log(`Upserted ${CATEGORY_FILTERS.length} category filters`);
    return CATEGORY_FILTERS.length;
  }
}
