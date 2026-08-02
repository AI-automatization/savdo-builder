# Savdo — Design System (Цвета, Темы, Психология)

> Главный файл по визуальному языку. Читать ПЕРЕД любой UI-задачей.
> Обновлён после замечаний: две темы, не-Steam палитра, eye-safety, конверсионная психология.

---

## ПОЧЕМУ СТАРАЯ ПАЛИТРА БЫЛА НЕПРАВИЛЬНОЙ

Первая версия (тёмный фиолетово-синий) имела проблемы:
- `#302b63` + `#63b3ed` = **Steam** (холодный, геймерский, недоверие у женской аудитории)
- Чистый тёмный синий = ночь/депрессия, не вызывает желания покупать
- Нет теплоты — нет доверия к продавцу
- Слишком холодные тени утомляют глаза при долгом использовании

---

## ПСИХОЛОГИЯ ЦВЕТА ДЛЯ E-COMMERCE

| Цвет | Психологический эффект | Где применять |
|------|----------------------|---------------|
| **Тёплый янтарь / оранжевый** | Импульс, энергия, аппетит, действие | CTA кнопки ("Купить", "В корзину") |
| **Изумрудный / тил** | Доверие, рост, свежесть, успех | Подтверждения, статус "одобрен", прогресс |
| **Тёплый кремовый фон** | Комфорт, уют, безопасность | Фон витрины, карточек товаров |
| **Глубокий индиго (тёплый)** | Премиум, надёжность, глубина | Дашборд продавца, sidebar |
| **Коралловый / тёплый красный** | Срочность, внимание | Бейдж "мало осталось", ошибки |
| **Золотой акцент** | Ценность, качество | Избранное, рейтинг, premium |

**Главное правило:** Фон = нейтральный и тёплый (не напрягает). Акцент = яркий только там где нужно действие.

---

## EYE SAFETY RULES

```
✓ Контраст текст/фон: минимум WCAG AA (4.5:1 для основного текста)
✓ Основной текст НЕ чистый белый (#fff) на тёмном — используй rgba(255,248,235,0.92)
✓ Основной текст НЕ чистый чёрный (#000) на светлом — используй #1a1714
✓ Фон НЕ чистый белый — слегка тёплый #faf8f5 или #f9f7f4
✓ Линейный градиент фона: разница оттенков max 15-20° по hue (не резкий перепад)
✓ Синий свет вечером утомляет — тёмная тема тёплая, НЕ холодная
✓ Размер текста: body min 15px (web) / 16px (mobile)
✓ Line-height: 1.55-1.65 для чтения
✓ Насыщенность акцентов: не 100% saturation — смягчать до 75-85%
```

---

## ТЕМА 1: "EMBER" — ТЁМНАЯ (для продавца и admin)

**Образ:** Тёплая узбекская ночь. Уголь + янтарь + золото.
**НЕ Steam.** Тёплые тени, не холодные.

### Палитра

```css
/* ── Фон ─────────────────────────────────────────────── */
--bg-base:      #0d0b08;   /* глубокий тёплый чёрный (не синий!) */
--bg-surface:   #171310;   /* чуть светлее */
--bg-elevated:  #211c17;   /* карточки, модалы */

/* Градиент фона */
background: linear-gradient(145deg,
  #0d0b08 0%,
  #1a1208 45%,
  #0f0d09 100%
);

/* ── Glass-поверхности (тёплое стекло) ───────────────── */
--glass-bg:         rgba(255, 243, 210, 0.06);
--glass-bg-hover:   rgba(255, 243, 210, 0.10);
--glass-border:     rgba(255, 200, 100, 0.16);
--glass-border-strong: rgba(255, 200, 100, 0.28);

/* ── Акценты ─────────────────────────────────────────── */
--accent-primary:   #f59e0b;   /* янтарь — главный акцент */
--accent-cta:       #f97316;   /* оранжевый — CTA кнопки */
--accent-success:   #10b981;   /* изумруд — одобрено, успех */
--accent-warning:   #fbbf24;   /* жёлтый — внимание */
--accent-danger:    #ef4444;   /* красный — ошибка, удаление */
--accent-info:      #38bdf8;   /* голубой — только инфо, не dominant */
--accent-gold:      #d97706;   /* золото — избранное, premium */

/* ── Текст ───────────────────────────────────────────── */
--text-primary:   rgba(255, 248, 235, 0.92);  /* тёплый белый */
--text-secondary: rgba(255, 220, 150, 0.55);  /* тёплый приглушённый */
--text-muted:     rgba(255, 210, 130, 0.35);  /* очень тихий */

/* ── Тени (тёплые!) ──────────────────────────────────── */
--shadow-card:  0 8px 32px rgba(0, 0, 0, 0.35);
--shadow-hover: 0 16px 48px rgba(0, 0, 0, 0.50);
--shadow-glow-amber: 0 0 24px rgba(245, 158, 11, 0.25);
--shadow-glow-orange: 0 0 24px rgba(249, 115, 22, 0.30);
```

### Blobs (живой фон)

```css
/* Два цветовых пятна за стеклом */
.blob-1 {
  background: radial-gradient(circle, #b45309 0%, transparent 70%);
  /* тёплый коричнево-оранжевый */
  filter: blur(100px);
  opacity: 0.18;
  width: 500px; height: 500px;
  position: absolute; top: -100px; right: -100px;
}
.blob-2 {
  background: radial-gradient(circle, #065f46 0%, transparent 70%);
  /* глубокий изумруд */
  filter: blur(120px);
  opacity: 0.12;
  width: 400px; height: 400px;
  position: absolute; bottom: 0; left: -50px;
}
```

### Компоненты в Ember

```css
/* Glass-карточка */
.card-ember {
  background: rgba(255, 243, 210, 0.06);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 200, 100, 0.16);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0,0,0,0.35),
    inset 0 1px 0 rgba(255, 220, 140, 0.12);
}
.card-ember:hover {
  background: rgba(255, 243, 210, 0.10);
  border-color: rgba(255, 200, 100, 0.28);
  box-shadow: 0 16px 48px rgba(0,0,0,0.50);
  transform: translateY(-2px);
}

/* CTA кнопка (главное действие) */
.btn-ember-cta {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  border: none;
  border-radius: 14px;
  color: #1a0f00;           /* тёмный текст на тёплом фоне — читаемость */
  font-weight: 700;
  letter-spacing: -0.01em;
  box-shadow:
    0 4px 20px rgba(249, 115, 22, 0.40),
    inset 0 1px 0 rgba(255,255,255,0.20);
}
.btn-ember-cta:hover {
  box-shadow: 0 8px 28px rgba(249, 115, 22, 0.55);
  transform: translateY(-1px);
}

/* Ghost кнопка */
.btn-ember-ghost {
  background: rgba(255, 243, 210, 0.06);
  border: 1px solid rgba(255, 200, 100, 0.20);
  border-radius: 14px;
  color: rgba(255, 248, 235, 0.80);
}

/* Input */
.input-ember {
  background: rgba(255, 243, 210, 0.05);
  border: 1px solid rgba(255, 200, 100, 0.18);
  border-radius: 14px;
  color: rgba(255, 248, 235, 0.92);
}
.input-ember:focus {
  border-color: rgba(245, 158, 11, 0.55);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
  background: rgba(255, 243, 210, 0.08);
}

/* Sidebar активный пункт */
.nav-active-ember {
  background: linear-gradient(90deg,
    rgba(245, 158, 11, 0.18),
    rgba(249, 115, 22, 0.10)
  );
  border-left: 3px solid #f59e0b;
  border-radius: 0 12px 12px 0;
  color: #fbbf24;
}
```

### Tailwind (Ember)

```html
<!-- Фон страницы -->
<div class="min-h-screen bg-[#0d0b08]"
     style="background: linear-gradient(145deg, #0d0b08, #1a1208, #0f0d09)">

<!-- Карточка -->
<div class="bg-[rgba(255,243,210,0.06)] backdrop-blur-xl
            border border-[rgba(255,200,100,0.16)] rounded-2xl
            shadow-[0_8px_32px_rgba(0,0,0,0.35)]
            hover:bg-[rgba(255,243,210,0.10)] hover:-translate-y-0.5
            transition-all duration-300">

<!-- CTA кнопка -->
<button class="bg-gradient-to-r from-amber-500 to-orange-500
               text-[#1a0f00] font-bold rounded-2xl
               shadow-[0_4px_20px_rgba(249,115,22,0.40)]
               hover:shadow-[0_8px_28px_rgba(249,115,22,0.55)]
               hover:-translate-y-px transition-all">

<!-- Текст -->
<p class="text-[rgba(255,248,235,0.92)]">  // основной
<p class="text-[rgba(255,220,150,0.55)]">  // вторичный
```

---

## ТЕМА 2: "BLOOM" — СВЕТЛАЯ (для витрины покупателя и лендинга)

**Образ:** Свежий базар ранним утром. Светло, чисто, аппетитно. Тянет смотреть и покупать.
**Не стерильный белый.** Тёплый кремовый с яркими акцентами.

### Палитра

```css
/* ── Фон ─────────────────────────────────────────────── */
--bg-base:      #faf8f4;   /* тёплый кремовый, не чистый белый */
--bg-surface:   #ffffff;
--bg-elevated:  #f3f0ea;   /* чуть темнее для разделения */

/* Градиент фона (очень тонкий) */
background: linear-gradient(160deg,
  #faf8f4 0%,
  #f0f9f6 50%,    /* едва заметный тил */
  #fdf6ee 100%    /* едва заметный янтарь */
);

/* ── Glass-поверхности (белое стекло) ────────────────── */
--glass-bg:         rgba(255, 255, 255, 0.72);
--glass-bg-hover:   rgba(255, 255, 255, 0.88);
--glass-border:     rgba(0, 0, 0, 0.07);
--glass-border-strong: rgba(0, 0, 0, 0.14);

/* ── Акценты ─────────────────────────────────────────── */
--accent-primary:   #0d9488;   /* тил — главный (доверие + свежесть) */
--accent-cta:       #f97316;   /* оранжевый — "В корзину", "Купить" */
--accent-success:   #059669;   /* зелёный — наличие, доставка */
--accent-warning:   #d97706;   /* янтарь — мало осталось */
--accent-danger:    #dc2626;   /* красный — нет в наличии */
--accent-gold:      #b45309;   /* золото — скидки, звёзды */

/* ── Текст ───────────────────────────────────────────── */
--text-primary:   #1a1714;    /* тёплый тёмный (не #000) */
--text-secondary: #6b6560;    /* тёплый серый */
--text-muted:     #a09890;    /* очень тихий */

/* ── Тени (мягкие) ───────────────────────────────────── */
--shadow-card:  0 2px 12px rgba(26, 23, 20, 0.08);
--shadow-hover: 0 8px 24px rgba(26, 23, 20, 0.14);
--shadow-glow-teal:   0 4px 20px rgba(13, 148, 136, 0.22);
--shadow-glow-orange: 0 4px 20px rgba(249, 115, 22, 0.28);
```

### Blobs (Bloom)

```css
.blob-bloom-1 {
  background: radial-gradient(circle, #99f6e4 0%, transparent 70%);
  /* тил — едва заметный */
  filter: blur(80px);
  opacity: 0.40;
}
.blob-bloom-2 {
  background: radial-gradient(circle, #fed7aa 0%, transparent 70%);
  /* персик — тёплый */
  filter: blur(100px);
  opacity: 0.35;
}
```

### Компоненты в Bloom

```css
/* Glass-карточка товара */
.card-bloom {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 20px;
  box-shadow:
    0 2px 12px rgba(26, 23, 20, 0.08),
    inset 0 1px 0 rgba(255,255,255,0.90);
}
.card-bloom:hover {
  background: rgba(255, 255, 255, 0.90);
  border-color: rgba(13, 148, 136, 0.20);
  box-shadow: 0 8px 24px rgba(26, 23, 20, 0.14);
  transform: translateY(-3px);
}

/* CTA "В корзину" / "Купить" */
.btn-bloom-cta {
  background: linear-gradient(135deg, #f97316, #ea580c);
  border: none;
  border-radius: 14px;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.35);
}
.btn-bloom-cta:hover {
  box-shadow: 0 8px 28px rgba(249, 115, 22, 0.50);
  transform: translateY(-1px);
}

/* Secondary кнопка (тил) */
.btn-bloom-secondary {
  background: linear-gradient(135deg,
    rgba(13, 148, 136, 0.12),
    rgba(13, 148, 136, 0.08)
  );
  border: 1px solid rgba(13, 148, 136, 0.30);
  border-radius: 14px;
  color: #0d9488;
  font-weight: 600;
}

/* Input */
.input-bloom {
  background: rgba(255, 255, 255, 0.90);
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 14px;
  color: #1a1714;
}
.input-bloom:focus {
  border-color: rgba(13, 148, 136, 0.50);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.10);
}
```

### Tailwind (Bloom)

```html
<!-- Карточка товара -->
<div class="bg-white/75 backdrop-blur-lg border border-black/7
            rounded-2xl shadow-sm
            hover:bg-white/90 hover:border-teal-500/20
            hover:-translate-y-1 transition-all duration-300">

<!-- CTA кнопка В корзину -->
<button class="bg-gradient-to-r from-orange-500 to-orange-600
               text-white font-bold rounded-2xl
               shadow-[0_4px_20px_rgba(249,115,22,0.35)]
               hover:shadow-[0_8px_28px_rgba(249,115,22,0.50)]
               hover:-translate-y-px transition-all">

<!-- Текст -->
<p class="text-[#1a1714]">          // основной
<p class="text-[#6b6560]">          // вторичный
<p class="text-[#a09890]">          // мuted
```

---

## КТО КАКУЮ ТЕМУ ИСПОЛЬЗУЕТ

| Приложение | Тема | Обоснование |
|-----------|------|-------------|
| `web-buyer` (витрина) | **Bloom** (светлая) | Покупатель хочет видеть товары чётко. Светлый фон = доверие, аппетитность. |
| `web-seller` (дашборд) | **Ember** (тёмная) | Продавец работает часами. Тёплая тёмная = не устают глаза. |
| `admin` | **Ember** (тёмная) | Таблицы + данные — тёмный фон комфортнее для работы. |
| `design-hop` (лендинг) | **Bloom** снаружи + **Ember** hero | Hero секция тёмная (вау-эффект), остальное светлое. |
| `mobile-seller` | **Ember** (тёмная) | Ночью в руках продавца — тёмная не слепит. |
| `mobile-buyer` | **Bloom** (светлая) | Днём в торговом центре — светлая читаемее. |

---

## СТАТУСЫ И БЕЙДЖИ (единые для обоих тем)

```css
/* Работают поверх обеих тем через полупрозрачность */

.badge-pending {
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.40);
  color: #fbbf24;
}
.badge-approved {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.40);
  color: #10b981;
}
.badge-rejected {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #ef4444;
}
.badge-suspended {
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.35);
  color: #f97316;
}
.badge-archived {
  background: rgba(148, 163, 184, 0.10);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #94a3b8;
}

/* Bloom-версии (тёмный текст на светлом фоне) */
.bloom .badge-pending  { color: #b45309; }
.bloom .badge-approved { color: #065f46; }
.bloom .badge-rejected { color: #991b1b; }
```

---

## ФОРМЫ И СКРУГЛЕНИЯ

```
Философия: округлые, мягкие, НЕ острые углы.
Острые углы = напряжение. Круглые = расслабление и доверие.

Радиусы:
  Мелкие элементы (чипы, бейджи, теги): 20-24px (почти круг)
  Кнопки: 14px
  Карточки: 20px
  Модальные окна: 24-28px
  Страницы / большие контейнеры: 28-32px
  Иконки в кнопках: 12px

Отступы внутри карточек:
  Маленькая карточка: 16px
  Средняя карточка: 20-24px
  Большая карточка: 28-32px
```

---

## КОНВЕРСИОННАЯ ПСИХОЛОГИЯ (UI который тянет)

### Принципы которые заставляют нажать

```
1. FOCAL POINT
   На каждом экране одна главная оранжевая кнопка.
   Всё остальное — тише. Глаз сам находит CTA.

2. SOCIAL PROOF рядом с CTA
   "★ 47 покупателей купили" под кнопкой "В корзину"
   Снижает барьер к покупке.

3. SCARCITY (дефицит)
   "Осталось 3 шт" — янтарный/оранжевый бейдж
   "Разбирают быстро" при остатке < 5

4. PROGRESS & MOMENTUM
   Онбординг с прогресс-баром — хочется дойти до 100%
   Корзина: "Ещё 50 000 сум до бесплатной доставки"

5. МИКРО-АНИМАЦИИ
   Кнопка "В корзину" — wiggle при добавлении
   Счётчик корзины — bounce при изменении
   Статус заказа — pulse у активного шага

6. HOVER = ЖИВОСТЬ
   Карточка товара: translateY(-3px) + тень = "поднимается навстречу"
   Создаёт ощущение что товар хочет быть взятым

7. ПУСТОЕ ПРОСТРАНСТВО (воздух)
   Не набивать экран. Пространство = премиум ощущение.
   Покупатель не чувствует давления.

8. ЦВЕТ = НАСТРОЕНИЕ
   Bloom (светлая): утро, свежесть, энергия → хочется покупать
   Ember (тёмная): вечер, сосредоточенность → хочется работать
```

---

## ТИПОГРАФИКА

```css
/* Шрифт: Inter (предпочтительно) или системный */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Шкала */
--text-xs:   0.75rem;   /* 12px — мелкие подписи, мета */
--text-sm:   0.875rem;  /* 14px — таблицы, вторичное */
--text-base: 1rem;      /* 16px — основной текст */
--text-lg:   1.125rem;  /* 18px — подзаголовки */
--text-xl:   1.25rem;   /* 20px — заголовки блоков */
--text-2xl:  1.5rem;    /* 24px — заголовки страниц */
--text-3xl:  1.875rem;  /* 30px — H1 на мобайле */
--text-4xl:  2.25rem;   /* 36px — H1 десктоп */
--text-hero: 3.5rem;    /* 56px — Hero лендинг */

/* Веса */
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
--font-black:     800;

/* Межстрочный интервал */
--leading-tight:  1.25;  /* заголовки */
--leading-normal: 1.55;  /* основной текст */
--leading-relaxed: 1.70; /* длинные тексты */

/* Трекинг заголовков */
h1, h2, h3 { letter-spacing: -0.025em; }
.label, .caption { letter-spacing: 0.04em; text-transform: uppercase; }
```

---

## ИКОНКИ

```
Библиотека: Lucide React (для web) / @expo/vector-icons (для mobile)

Размеры:
  Навигация/sidebar: 20px
  Внутри кнопок: 16px
  Статусы: 14px
  Hero/Features секция: 32-40px

Стиль: stroke, НЕ fill (легче, воздушнее, соответствует glass)
Толщина stroke: 1.5px (стандарт Lucide)

Цвет иконок:
  Ember: rgba(255, 248, 235, 0.70)
  Bloom: rgba(26, 23, 20, 0.55)
  Активная/акцентная: цвет акцента темы
```

---

## АНИМАЦИИ И ПЕРЕХОДЫ

```css
/* Стандартные переходы */
--transition-fast:   150ms ease;
--transition-normal: 250ms ease;
--transition-slow:   350ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover карточки */
transition: transform 300ms ease, box-shadow 300ms ease, background 200ms ease;

/* Появление элементов (scroll) */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Добавление в корзину */
@keyframes cartBounce {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.3); }
}

/* Floating (мокап телефона на лендинге) */
@keyframes floating {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}
animation: floating 4s ease-in-out infinite;

/* Pulse (CTA кнопка) */
@keyframes subtlePulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(249,115,22,0.35); }
  50%       { box-shadow: 0 4px 30px rgba(249,115,22,0.55); }
}
```

---

## ПРИМЕР ПРОМТА С ТЕМОЙ

```
Контекст: [вставь design-system.md + нужный design-*.md]

Задача: Создай карточку товара для витрины покупателя.
Тема: BLOOM (светлая). Тёплый кремовый фон.
Фото 1:1, название, цена с зачёркнутой старой,
бейдж "Осталось 3 шт" (янтарный), кнопка "В корзину" (оранжевая).
Hover: карточка поднимается на 3px, тень усиливается.
Next.js 14, Tailwind CSS.
```

---

*Savdo · design-system.md · v2.0 · Обновлено: замечания по Steam-палитре*
