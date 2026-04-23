import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface SeedCategory {
  slug: string;
  nameRu: string;
  nameUz: string;
  parentSlug: string | null;
  level: number;
  sortOrder: number;
}

interface SeedFilter {
  categorySlug: string;
  key: string;
  nameRu: string;
  nameUz: string;
  fieldType: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN';
  options?: string[];
  unit?: string;
  sortOrder: number;
}

const CATEGORIES: SeedCategory[] = [
  // ── Level 0 (root) ──────────────────────────────────────────────────────────
  { slug: 'electronics',  nameRu: 'Электроника',         nameUz: 'Elektronika',        parentSlug: null, level: 0, sortOrder: 10 },
  { slug: 'appliances',   nameRu: 'Бытовая техника',     nameUz: 'Maishiy texnika',    parentSlug: null, level: 0, sortOrder: 20 },
  { slug: 'clothing',     nameRu: 'Одежда',              nameUz: 'Kiyimlar',           parentSlug: null, level: 0, sortOrder: 30 },
  { slug: 'automotive',   nameRu: 'Автомобили',          nameUz: 'Avtomobillar',       parentSlug: null, level: 0, sortOrder: 40 },
  { slug: 'furniture',    nameRu: 'Мебель',              nameUz: 'Mebel',              parentSlug: null, level: 0, sortOrder: 50 },
  { slug: 'books',        nameRu: 'Книги',               nameUz: 'Kitoblar',           parentSlug: null, level: 0, sortOrder: 60 },
  { slug: 'outdoor',      nameRu: 'На открытом воздухе', nameUz: 'Ochiq havoda',       parentSlug: null, level: 0, sortOrder: 70 },

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

  // ── Level 1 — Automotive ─────────────────────────────────────────────────────
  { slug: 'cars',        nameRu: 'Автомобили (новые)', nameUz: 'Avtomobillar (yangi)',        parentSlug: 'automotive', level: 1, sortOrder: 10 },
  { slug: 'cars_used',   nameRu: 'Автомобили (б/у)',   nameUz: 'Avtomobillar (ishlatilgan)', parentSlug: 'automotive', level: 1, sortOrder: 20 },
  { slug: 'motorcycles', nameRu: 'Мотоциклы',          nameUz: 'Mototsikllar',               parentSlug: 'automotive', level: 1, sortOrder: 30 },

  // ── Level 1 — Furniture ───────────────────────────────────────────────────────
  { slug: 'sofa', nameRu: 'Диваны',  nameUz: 'Divanlar',   parentSlug: 'furniture', level: 1, sortOrder: 10 },
  { slug: 'beds', nameRu: 'Кровати', nameUz: 'Karavotlar', parentSlug: 'furniture', level: 1, sortOrder: 20 },

  // ── Level 1 — Books ───────────────────────────────────────────────────────────
  { slug: 'fiction',     nameRu: 'Художественная литература',   nameUz: 'Badiiy adabiyot',  parentSlug: 'books', level: 1, sortOrder: 10 },
  { slug: 'non_fiction', nameRu: 'Нехудожественная литература', nameUz: 'Ommabop adabiyot', parentSlug: 'books', level: 1, sortOrder: 20 },

  // ── Level 1 — Outdoor ────────────────────────────────────────────────────────
  { slug: 'bikes', nameRu: 'Велосипеды', nameUz: 'Velosipedlar', parentSlug: 'outdoor', level: 1, sortOrder: 10 },

  // ── Level 2 ───────────────────────────────────────────────────────────────────
  { slug: 'smartphones',   nameRu: 'Смартфоны',        nameUz: 'Smartfonlar', parentSlug: 'phones', level: 2, sortOrder: 10 },
  { slug: 'pc_components', nameRu: 'Комплектующие ПК', nameUz: 'PK qismlari', parentSlug: 'pc',     level: 2, sortOrder: 10 },
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

  // ── Автомобили (новые) ───────────────────────────────────────────────────────
  { categorySlug: 'cars', key: 'brand',       nameRu: 'Марка',     nameUz: 'Marka',         fieldType: 'SELECT', options: ['Chevrolet','Hyundai','Kia','Toyota','Lexus','Mercedes','BMW','Audi','Другой'], sortOrder: 10 },
  { categorySlug: 'cars', key: 'model',       nameRu: 'Модель',    nameUz: 'Model',         fieldType: 'TEXT', sortOrder: 20 },
  { categorySlug: 'cars', key: 'year',        nameRu: 'Год',       nameUz: 'Yil',           fieldType: 'NUMBER', sortOrder: 30 },
  { categorySlug: 'cars', key: 'color',       nameRu: 'Цвет',      nameUz: 'Rang',          fieldType: 'SELECT', options: COLORS_RU, sortOrder: 40 },
  { categorySlug: 'cars', key: 'engine',      nameRu: 'Двигатель', nameUz: 'Dvigatel',      fieldType: 'SELECT', options: ['1.0','1.2','1.4','1.5','1.6','1.8','2.0','2.5','3.0','3.5'], unit: 'л', sortOrder: 50 },
  { categorySlug: 'cars', key: 'transmission',nameRu: 'КПП',       nameUz: 'Uzatmalar qutisi',fieldType: 'SELECT', options: ['Автомат','Механика','Вариатор','Робот'], sortOrder: 60 },

  // ── Автомобили (б/у) ─────────────────────────────────────────────────────────
  { categorySlug: 'cars_used', key: 'brand',        nameRu: 'Марка',     nameUz: 'Marka',         fieldType: 'SELECT', options: ['Chevrolet','Hyundai','Kia','Toyota','Lexus','Mercedes','BMW','Audi','Другой'], sortOrder: 10 },
  { categorySlug: 'cars_used', key: 'model',        nameRu: 'Модель',    nameUz: 'Model',         fieldType: 'TEXT', sortOrder: 20 },
  { categorySlug: 'cars_used', key: 'year',         nameRu: 'Год',       nameUz: 'Yil',           fieldType: 'NUMBER', sortOrder: 30 },
  { categorySlug: 'cars_used', key: 'mileage',      nameRu: 'Пробег',    nameUz: 'Yurgan masofasi',fieldType: 'NUMBER', unit: 'км', sortOrder: 40 },
  { categorySlug: 'cars_used', key: 'color',        nameRu: 'Цвет',      nameUz: 'Rang',          fieldType: 'SELECT', options: COLORS_RU, sortOrder: 50 },
  { categorySlug: 'cars_used', key: 'engine',       nameRu: 'Двигатель', nameUz: 'Dvigatel',      fieldType: 'SELECT', options: ['1.0','1.2','1.4','1.5','1.6','1.8','2.0','2.5','3.0','3.5'], unit: 'л', sortOrder: 60 },
  { categorySlug: 'cars_used', key: 'transmission', nameRu: 'КПП',       nameUz: 'Uzatmalar qutisi',fieldType: 'SELECT', options: ['Автомат','Механика','Вариатор','Робот'], sortOrder: 70 },
  { categorySlug: 'cars_used', key: 'condition',    nameRu: 'Состояние', nameUz: 'Holat',         fieldType: 'SELECT', options: ['Отличное','Хорошее','Удовлетворительное','Требует ремонта'], sortOrder: 80 },

  // ── Мотоциклы ────────────────────────────────────────────────────────────────
  { categorySlug: 'motorcycles', key: 'brand',       nameRu: 'Марка',     nameUz: 'Marka',   fieldType: 'SELECT', options: ['Honda','Yamaha','Suzuki','Kawasaki','Другой'], sortOrder: 10 },
  { categorySlug: 'motorcycles', key: 'year',        nameRu: 'Год',       nameUz: 'Yil',     fieldType: 'NUMBER', sortOrder: 20 },
  { categorySlug: 'motorcycles', key: 'engine_cc',   nameRu: 'Объём',     nameUz: 'Hajm',    fieldType: 'NUMBER', unit: 'куб.см', sortOrder: 30 },
  { categorySlug: 'motorcycles', key: 'mileage',     nameRu: 'Пробег',    nameUz: 'Yurgan masofasi', fieldType: 'NUMBER', unit: 'км', sortOrder: 40 },
  { categorySlug: 'motorcycles', key: 'color',       nameRu: 'Цвет',      nameUz: 'Rang',    fieldType: 'SELECT', options: COLORS_RU, sortOrder: 50 },

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
];

@Injectable()
export class GlobalCategoriesSeedService implements OnModuleInit {
  private readonly logger = new Logger(GlobalCategoriesSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.seedFilters();
  }

  async seedCategories(): Promise<number> {
    const slugToId = new Map<string, string>();
    const sorted = [...CATEGORIES].sort((a, b) => a.level - b.level);

    for (const cat of sorted) {
      const parentId = cat.parentSlug ? (slugToId.get(cat.parentSlug) ?? null) : null;
      const record = await this.prisma.globalCategory.upsert({
        where: { slug: cat.slug },
        update: { nameRu: cat.nameRu, nameUz: cat.nameUz, sortOrder: cat.sortOrder, isActive: true },
        create: { slug: cat.slug, nameRu: cat.nameRu, nameUz: cat.nameUz, parentId, sortOrder: cat.sortOrder, isActive: true },
      });
      slugToId.set(cat.slug, record.id);
    }

    this.logger.log(`Upserted ${sorted.length} global categories`);
    return sorted.length;
  }

  async seedFilters(): Promise<number> {
    for (const f of CATEGORY_FILTERS) {
      await this.prisma.categoryFilter.upsert({
        where: { categorySlug_key: { categorySlug: f.categorySlug, key: f.key } },
        update: { nameRu: f.nameRu, nameUz: f.nameUz, fieldType: f.fieldType, options: f.options ? JSON.stringify(f.options) : null, unit: f.unit ?? null, sortOrder: f.sortOrder },
        create: { categorySlug: f.categorySlug, key: f.key, nameRu: f.nameRu, nameUz: f.nameUz, fieldType: f.fieldType, options: f.options ? JSON.stringify(f.options) : null, unit: f.unit ?? null, sortOrder: f.sortOrder },
      });
    }

    this.logger.log(`Upserted ${CATEGORY_FILTERS.length} category filters`);
    return CATEGORY_FILTERS.length;
  }
}
