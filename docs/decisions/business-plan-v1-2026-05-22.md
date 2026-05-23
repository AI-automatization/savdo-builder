# Business Plan v1 — maxsavdo (бывш. savdo-builder)

**Дата:** 2026-05-22
**Статус:** 🟡 **Draft v1** — требует sign-off Полата + Азима по open questions.
**Связано:** [`pricing-tiers-v1-2026-05-21.md`](./pricing-tiers-v1-2026-05-21.md), [`launch-readiness-2026-05-20.md`](../readiness/launch-readiness-2026-05-20.md), `analiz/lead-gen/project_lead_gen_channels.md` (если есть)

---

## 0. Что это и зачем

**maxsavdo** = Telegram-native e-commerce платформа для малых UZ-продавцов.

Не маркетплейс a-la Uzum. Не интернет-магазин на Tilda. **Storefront + checkout + buyer CRM**, встроенные в Telegram — где продавец уже работает с аудиторией.

Триггер: на UZ-рынке нет инфры между «продаю в DM» и «выкладываюсь на Uzum (10-15% комиссии + жёсткая модерация)».

---

## 1. Аудитория (Personas)

### 🛍 B2B — продавцы (paying side)

| # | Персона | Описание | Боль | Размер сегмента (UZ) |
|---|---------|----------|------|----------------------|
| 1 | **Telegram-channel seller** | Малый бизнес уже продаёт в TG-канале (одежда, food, crafts, electronics). У канала 1-50k подписчиков. | Корзина и заказы — вручную через DM. Заказы теряются. Нет аналитики. | ~15-30k |
| 2 | **Instagram-микро-продавец** | Продаёт через сторис/DM. Хочет упорядочить. | Те же боли + IG не оптимален для e-commerce. | ~20-40k |
| 3 | **Региональный продавец** | Не Tashkent (Самарканд, Бухара, Фергана, регионы). | Uzum/Olcha логистика слабая в регионах. Местные покупатели вне маркетплейсов. | ~10-20k |
| 4 | **Self-employed / ремесленник** | Керамика Риштана, сюзани, атлас, food-artisan (мясо-молочка, выпечка). | Аутентика не вписывается в массовые маркетплейсы; нужен «свой» storefront. | ~5-10k |

**Total addressable sellers (TAM):** **50-100k** малых продавцов в UZ.

### 🛒 B2C — покупатели (free side)

| # | Персона | Описание | Размер сегмента (UZ) |
|---|---------|----------|----------------------|
| 1 | **TG-активный молодой UZ** | 18-35 лет, 80% времени в Telegram, не привязан к одному маркетплейсу. | ~8-10M |
| 2 | **Региональный покупатель** | Не-Tashkent, Uzum-доставка медленная/дорогая, доверяет локальным продавцам. | ~10-12M |
| 3 | **Loyal buyer конкретного канала** | Уже покупал у продавца в DM, хочет нормальный checkout без bargaining. | ~3-5M |

**Не наша аудитория:**
- Покупатели бытовой электроники / mainstream товаров — Uzum/Asaxiy
- Cross-border шопперы — AliExpress / Wildberries
- Большие brands со своими сайтами

---

## 2. Jobs to be Done

### Продавец нанимает maxsavdo, чтобы…
1. ✅ «Принимать заказы автоматически, не теряя в DM-переписке»
2. ✅ «Видеть аналитику: что продаётся, кто покупает, какая возвратность»
3. ✅ «Иметь storefront чтобы делиться ссылкой клиенту, а не каталог в DM скриншотами»
4. ✅ «Принимать платёж онлайн (Phase 2, Click/Payme)»
5. ⏳ «Делать рекламу — найти новых покупателей вне моего канала»

### Покупатель нанимает maxsavdo, чтобы…
1. ✅ «Купить локальное у проверенного продавца, не Uzum»
2. ✅ «Не качать ещё одно приложение — всё в Telegram»
3. ✅ «Видеть отзывы и rating до покупки»
4. ✅ «Получить заказ — доставка или самовывоз»
5. ⏳ «Возвращаться к любимому продавцу легко (loyalty)»

---

## 3. Конкуренция и позиционирование

| Конкурент | Их позиционирование | Наша отстройка |
|-----------|---------------------|----------------|
| **Uzum** | National marketplace, всё в одном | Не-маркетплейс, **storefront продавца с его brand'ом**. Никакой 15% комиссии. |
| **Olcha** | Marketplace + electronics focus | То же — мы про малых продавцов, не электронику |
| **Asaxiy** | Marketplace + finance | То же |
| **Tilda / Shopify** | Хостинг сайтов | Дорого ($30+/mo), сложно настроить, не Telegram-native |
| **ManyChat / TG-боты builders** | Conversation-focused | Мы про storefront + structured commerce, не диалог |
| **DM в Telegram** (status quo) | Бесплатно, есть | Нет корзины, заказов, аналитики, оплаты |

**Наша позиция:** «**Storefront в Telegram за 5 минут — без сайтостроения, без маркетплейса.**»

**Differentiators:**
- Telegram-native (Mini App + bot) — нет «новое app»
- Per-seller storefront — продавец сохраняет brand-identity
- UZ-локально — узбек + русский, локальные платежи (Phase 2)
- Низкий порог входа (Free Beta + дешёвый Starter)

---

## 4. Market sizing

| Уровень | Размер | Расчёт |
|---------|--------|--------|
| **TAM** (Total Addressable Market) | 50-100k продавцов | Все малые TG/IG-продавцы UZ |
| **SAM** (Serviceable Available) | 15-25k | Те у кого ≥500 заказов/мес — экономика билдинга оправдана |
| **SOM** (Serviceable Obtainable, год 1) | 200-500 | Реалистичная adoption первого года (1-3% от SAM) |
| **SOM** (год 2-3) | 2-5k | Если PMF подтвердится |

### Revenue projection (по pricing-v1)

Per-seller ARPU (mix Free Beta / Starter / Pro / Business):
- Free Beta (50% sellers первый год): 0 UZS/mo
- Starter (35%): 200k UZS/mo
- Pro (12%): 500k UZS/mo
- Business (3%): 1.5M UZS/mo

Weighted ARPU: ~0×0.5 + 200k×0.35 + 500k×0.12 + 1.5M×0.03 = **175k UZS/mo per seller**

**Год 1 при 300 sellers (середина SOM-диапазона):**
- 300 × 175k UZS/mo × 12 = **630M UZS/год** ≈ **$50,000**
- After Click/Payme: + 1-2% commission на GMV → +20-40% revenue

**Год 2-3 при 2,000 sellers:**
- ~$330k/год revenue + commission overlay → realistic $500-700k/год при правильном adoption

---

## 5. Revenue model

**Phase 1 (now — Click/Payme заморожены):**
- Subscription only (Starter / Pro / Business)
- Free Beta для первых 100 продавцов (PMF)
- Manual activation (Полат через admin → admin-panel)

**Phase 2 (после открытия Click/Payme — Q3 2026):**
- Subscription **+ commission** на каждую сделку (Starter 2%, Pro 1.5%, Business 1%)
- Добавляется Pay-as-you-go тариф (0 subscription, 5% commission)

**Phase 3 (год 2):**
- Promoted listings (продавец платит за поднятие в выдаче)
- Storefront templates premium (кастомные дизайны)
- White-label для крупных (Business+)

См. полные тарифы в [`pricing-tiers-v1-2026-05-21.md`](./pricing-tiers-v1-2026-05-21.md).

---

## 6. Go-to-market (lead gen)

### Acquisition channels (приоритет)

| # | Канал | Cost | Speed | Volume |
|---|-------|------|-------|--------|
| 1 | **Referral program** (продавец приводит → 50% off месяц) | $0 viral | 🐢 ramp | 🔥 high LTV |
| 2 | **IG/TG микро-инфлюенсеры UZ** (10-50k подписчиков) | Низкий ($50-200 за post) | ⚡ fast | Medium |
| 3 | **TG-чаты Uzum/OLX продавцов** (там жалуются на 15% комиссию) | $0 organic | 🐢 ramp | High |
| 4 | **IT Park UZ** — startup community | $0 networking | Medium | Low volume но высокое качество |
| 5 | **Click/Payme партнёрство** (Phase 2) | TBD | Long | High |
| 6 | **Local региональные TG-каналы** (Samarkand, Bukhara) | Низкий | Medium | Medium |
| 7 | **Content marketing** (uz/ru блог о Telegram-commerce) | $0 organic | 🐢 long | Long-tail |
| 8 | **Direct outreach** (продавцам в TG/IG которые продают вручную) | Время | Slow | Hyper-targeted |
| 9 | **Web-buyer SEO** (как покупатели находят магазины) | $0 organic | Long | Indirect |
| 10 | **Paid ads** (FB/IG/TG-ads) | $500+/mo | Fast | Scale |

### Soft launch plan (первые 100 продавцов)
- Phase A (weeks 1-2): Personal outreach — Полат + Азим знакомым продавцам, 20-30 sellers manually onboarded
- Phase B (weeks 3-6): Referrals + 1-2 IG inflocers (50-60 sellers)
- Phase C (weeks 7-12): Content + organic + первые ads (100+ sellers)

---

## 7. Roadmap milestones

| Milestone | Когда | Что |
|-----------|-------|-----|
| **Soft launch (closed beta)** | T-0 (после Legal + restore-drill) | 50 sellers, manual onboarding, Free Beta tariff |
| **Public launch** | T+1 мес | Open для всех, Starter тариф активен, content marketing on |
| **First paying milestone** | T+3 мес | 50 paying sellers (на Starter+Pro), $5k MRR |
| **Click/Payme integration** | T+4-6 мес | После бизнес-счёта. Commission tariff layer. |
| **Scale milestone** | T+12 мес | 500 sellers, $20-30k MRR |
| **Series A consideration** | T+18 мес | Если ramp ровный, valuation+fundraise |

---

## 8. Key risks + mitigation

| Риск | Вероятность | Impact | Mitigation |
|------|------------|--------|------------|
| **Uzum выпускает аналог** (Telegram Mini App-storefront) | Med | High | Скорость до PMF, отстройка через local-vibe / маленькие продавцы / no-commission |
| **Click/Payme не подключим вовремя** | Med | Med | Subscription-only modela survives (Phase 1 design) |
| **Продавцы не готовы платить вперёд** (UZ cash-on-delivery культура) | Med | High | Free Beta для PMF, низкий Starter, manual onboarding |
| **Конкурент демпингует** (бесплатный аналог) | Low | High | Focus на UX/quality, brand loyalty, экосистема (storefront + chat + analytics + buyer protection) |
| **Telegram меняет Mini App API** (breaking) | Low | Med | Watch Telegram changelog, дублировать критичные паттерны в web-buyer |
| **Регуляторика UZ** (e-commerce требования юр.лицу) | High | Med | Регистрация ИП/ООО — в процессе. Требования соблюдены через offer/privacy/terms. |

---

## 9. Команда и роли

| Роль | Кто | Зона |
|------|-----|------|
| **Backend / API / Admin** | Полат | `apps/api`, `apps/admin`, `packages/db`, `packages/types`, infra |
| **Frontend (web-buyer + web-seller)** | Азим | `apps/web-buyer`, `apps/web-seller` |
| **TMA** | Полат (i18n, smoke) + Азим (UI features) | `apps/tma` shared |
| **Design / Brand** | Азим (lead) | Soft Color Lifestyle palette session 52 — see `docs/brand/` |
| **Product / Strategy** | Полат + Азим совместно | ADRs + decisions |

---

## 10. Open questions для sign-off

1. **Имя бренда** — окончательно `maxsavdo`? Или ребрендим целиком?
2. **Pricing v1** — 5 вопросов из [`pricing-tiers-v1-2026-05-21.md`](./pricing-tiers-v1-2026-05-21.md).
3. **Soft launch размер** — 50 sellers (как тут) или 100 (как в pricing)? Унифицировать.
4. **Phase A outreach** — кому конкретно Полат/Азим напишут первыми? Список 20-30 имён нужен.
5. **Inflocer budget** — есть ли $200-500 на Phase B?
6. **Content marketing** — кто будет писать (Азим/Полат сам или подрядчик)?
7. **Целевая дата public launch** — июль 2026? сентябрь? до Q4?

---

## 11. Что НЕ в scope

- **RAOS** — отдельный продукт (POS/ERP/CRM), не сливаем с maxsavdo. См. ADR об архитектурном разделении.
- **Cross-border** — не наш TAM. UZ-only первые 18 мес минимум.
- **B2B SaaS (для крупных компаний)** — мы для малых продавцов, не для корпоратов.
- **Mobile-native apps** — Phase 3+. TMA покрывает mobile-experience через Telegram.

---

**Status:** ⏳ Ждёт sign-off Полат + Азим по 7 open questions выше. После — финализация Business Plan v1 → переходим к Phase A soft launch outreach.
