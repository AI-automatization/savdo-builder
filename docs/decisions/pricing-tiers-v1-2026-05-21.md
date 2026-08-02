# Pricing Tiers v1 — Final (Claude-proposed defaults, 24.05)

**Дата:** 2026-05-21 (создан), **2026-05-24** (Claude финализировал defaults)
**Статус:** 🟢 **v1-final (claude defaults)** — open для override Полатом/Азимом в любой момент. Если консенсус не пересмотрит за 7 дней — становится фактическим v1.
**Owner:** Полат (research), Полат + Азим (final call — override if needed)
**Триггер:** Pre-launch — нужна модель монетизации до publlic launch.
**Связано:** [ADR-003 (no payments in MVP)](../adr/ADR-003_no_payments_mvp.md), [`MARKETING-PAYMENT-CLICK-PAYME-001`](../../analiz/tasks.md), [`launch-readiness-2026-05-20.md`](../readiness/launch-readiness-2026-05-20.md) (Payments score 5/10).

---

## Контекст

savdo-builder выходит в public launch без онлайн-платежей (Click/Payme заморожены
до открытия бизнес-счёта). Текущая модель активации продавца — **ручная**:
продавец пишет в Telegram → админ через панель открывает доступ
(`POST /admin/users/:id/activate-seller-on-market`, ADM-MANUAL-ACTIVATION-UI-001).

Это создаёт **окно возможностей** для subscription-модели: оплата ручная (банк-перевод
/ наличные / Telegram-bot), активация ручная. Не нужен платёжный шлюз.

Когда Click/Payme включатся (Phase 2) — переходим на hybrid (subscription + commission).

---

## 4 ключевых решения

| # | Решение | Варианты | Рекомендация v1 |
|---|---------|----------|-----------------|
| 1 | **Модель монетизации** | Subscription / Commission / Hybrid | **Subscription** (сейчас), переход на Hybrid после Click/Payme |
| 2 | **Free tier?** | Да / Нет / Trial | **Free Beta** для первых 100 продавцов + **Trial 14 дней** для остальных |
| 3 | **Value metric** | Per seller / per store / per product / per order | **Per store** (один продавец = один магазин = одна подписка) |
| 4 | **Валюта** | UZS / USD / оба | **UZS** primary, USD price справочно |

---

## 3 модели — оценка по scoring matrix

Веса критериев (сумма 1.00):

| Критерий | Вес | Что меряет |
|----------|----:|------------|
| Feasibility сейчас (без Click/Payme) | 0.25 | можно ли запустить **сегодня** без инфры |
| Revenue predictability | 0.15 | насколько стабилен MRR |
| UZ adoption-friendly | 0.15 | low barrier для UZ-микро-продавца |
| Scaling с продавцом | 0.10 | растёт ли выручка с успехом продавца |
| Простота для продавца | 0.15 | легко понять и платить |
| Энфорсмент (можно ли деактивировать неплательщика) | 0.10 | если не платит — отключим? |
| Path to Click/Payme model | 0.10 | как переходим в Phase 2 |

| # | Модель | Feas | Pred | UZ | Scale | Simp | Enf | Path | **Total** |
|---|--------|:----:|:----:|:--:|:-----:|:----:|:---:|:----:|:--------:|
| A | **Subscription only** | 10 | 9 | 7 | 5 | 9 | 8 | 8 | **8.20** |
| B | **Commission only** | 2 | 6 | 9 | 10 | 7 | 3 | 7 | **5.85** |
| C | **Hybrid (sub + comm)** | 4 | 8 | 8 | 9 | 6 | 6 | 9 | **6.85** |

**Winner: Subscription only (8.20)** — выигрывает с margin **+1.35** над Hybrid (выше порога значимости 0.5 из decision-framework).

Главный driver — feasibility сейчас: commission технически невозможна без автоматического удержания % при оплате (нет Click/Payme).

---

## Конкретные ступени (proposal v1)

Цены в UZS, USD-эквивалент справочно (~12,700 UZS/USD на 2026-05).

| Тариф | UZS/мес | USD (~) | Что включено | Целевая аудитория |
|-------|---------|---------|--------------|------------------|
| **Free Beta** | 0 | $0 | Все фичи, **первые 100 продавцов**, manual activation админом, до окончания beta (Q3 2026) | Early adopters, product-market fit |
| **Starter** | 200,000 | $16 | До 50 товаров, до 100 заказов/мес, базовая аналитика, 1 магазин, ru/uz | Микро-продавцы, частники |
| **Pro** | 500,000 | $40 | Безлимит товаров, до 500 заказов/мес, custom branding, priority Telegram-поддержка, advanced analytics, abandoned-cart push | Активные продавцы, малый бизнес |
| **Business** | 1,500,000 | $120 | Безлимит всего, multi-store (несмотря на INV-S01 — для холдингов), dedicated manager, API access, white-label storefront | Крупные продавцы, бренды |

**Модификаторы:**
- **Annual discount:** −20% при оплате за 12 мес (= 2 месяца бесплатно)
- **Referral program:** приведи активного продавца (≥1 месяц на платном тарифе) → твой следующий месяц −50%
- **Migration discount:** для тех, кто уже продаёт в Telegram-канале вручную → первые 3 месяца Starter за 100k UZS

---

## Phase 2 — после подключения Click/Payme

Переход на **Hybrid** через ~6 месяцев после public launch (когда Click/Payme подключены, бизнес-счёт открыт, есть live-данные о объёмах).

Изменения:
- Each tariff += commission на каждую сделку через Click/Payme:
  - Free Beta → исчезает (или становится free-trial 14 дней)
  - Starter → 2% комиссия
  - Pro → 1.5%
  - Business → 1%
- Появляется **«Pay-as-you-go» тариф:** 0₽ subscription, 5% комиссия — для тех кто редко продаёт.

---

## Открытые вопросы для sign-off

1. **🔴 Free Beta для первых 100 vs trial 14 дней?** Beta = больше adoption, медленнее cash-flow. Trial = быстрее cash-flow, выше friction. **Моё:** Beta для PMF.
2. **🟡 Цены 200k / 500k / 1.5M — норм или сдвинуть?** UZ-чувствительный рынок. Конкуренты:
   - Tilda: ~3,000 ₽/мес ($30) — но локально дороже
   - Telegram bot-builders (manyChat etc): $10-30/мес
   - Uzum/Olcha — commission-only, не сравним
   - **Моё:** 200k starter — на грани, можно опуститься до 150k.
3. **🟡 Annual discount —20% — норм?** Industry standard 15-20%. **Моё:** 20% — стандарт, аtraktивно.
4. **🟢 Per store vs per seller?** Если seller имеет multi-store (Business тариф) — он платит **один тариф за все магазины** или **один Business + per-store fee**? **Моё:** Business включает multi-store без extra fee.
5. **🟢 UZS-only или дублировать USD?** **Моё:** UZS primary в UI, USD только в маркетинге для международной аудитории.

---

## Risk register

| Риск | Вероятность | Impact | Mitigation |
|------|-------------|--------|------------|
| **UZ-продавец не готов платить вперёд** (cash-on-delivery культура) | Med | High | Free Beta + low Starter (200k) + manual onboarding убрать friction |
| **Demphasizing free tier тормозит adoption** | Med | Med | Free Beta для 100 — даём run-way, по результатам решаем |
| **Click/Payme никогда не подключатся** | Low | High | Subscription survive самостоятельно — это и есть наш hedge |
| **Конкурент демпингует** (Uzum выпускает аналог) | Med | High | Differentiation через UZ-локальность + Telegram-native (Uzum web-only) |
| **Сложно объяснить multi-store в Business** | Low | Low | Документация + наглядный пример в onboarding |

---

## Что для Round 2 (если эти цены отлетят)

- Цены ниже (Starter 100k, Pro 300k)?
- Лимиты иные (по транзакциям, не по продуктам)?
- Совершенно другая модель (lifetime deal, freemium aggressive)?

---

**Status:** ⏳ Ждёт sign-off от Полат + Азим по 5 открытым вопросам выше.
**Next step:** ответы на вопросы → финализация v1 → коммуникация в onboarding flow + landing page.
