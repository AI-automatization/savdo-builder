# Landing Deploy Checklist — Pre-push Protocol

Запускай ПЕРЕД каждым `git push` в ветку `landing`.

---

## ERR-L001 — Monorepo build context (turbo вместо next build)

**Симптом:** `> turbo build` + `Could not resolve workspaces`
**Причина:** Dockerfile использует `COPY . .` от корня репо → запускается корневой `package.json`
**Формула проверки:**
```bash
grep "COPY \. \." apps/landing/Dockerfile
# Если нашёл — СТОП. Нужно COPY apps/landing/ .
grep "dockerfilePath" apps/landing/railway.toml
# Должно быть: apps/landing/Dockerfile (полный путь)
```

---

## ERR-L002 — package-lock.json out of sync (npm ci падает)

**Симптом:** `npm error code EUSAGE` + `Missing: typescript-eslint@X from lock file`
**Причина:** `package.json` обновлён, `package-lock.json` не перегенерирован
**Формула проверки:**
```bash
# Если менял package.json — обязательно:
cd apps/landing && npm install --legacy-peer-deps
git add apps/landing/package-lock.json
```
**Постоянный фикс:** Dockerfile использует `npm install --legacy-peer-deps` вместо `npm ci`

---

## ERR-L003 — Named imports вместо default (компонент не найден)

**Симптом:** `'Header' is not exported from '@/components/Header'`
**Причина:** `ru/page.tsx` импортирует `{ Header }` но компонент экспортирует `export default`
**Формула проверки:**
```bash
grep "^export default" apps/landing/src/components/*.tsx | wc -l
# Должно быть 8 (Header Hero How Features FeaturedStores Pricing FAQ Footer)
grep "^import {" apps/landing/src/app/ru/page.tsx
# Должно быть пусто — все импорты без фигурных скобок
```

---

## ERR-L004 — Type mismatch Dict → ComponentDict (missing field)

**Симптом:** `Type error: Property 'cta' is missing in type 'Dict'`
**Причина:** Локальный тип компонента требует поле которого нет в `Dict` из i18n.ts
**Формула проверки:**
```bash
cd apps/landing && npx tsc --noEmit 2>&1 | head -30
# Должно быть: пусто (0 ошибок)
```
**Правило:** Компонентные типы (HeaderDict, HeroDict и т.д.) — ТОЛЬКО подмножество полей из `Dict`.
Никаких дополнительных полей не добавлять если их нет в `Dict`.

---

## ERR-L005 — Railway "Redeploy" пересобирает старый закреплённый коммит, не HEAD ветки

**Симптом:** после оплаты биллинга нажали Redeploy на зависшем деплое → статус Active,
но `/faq`/`/qollanma`/8 пунктов навигации всё ещё не видно на проде.
**Причина:** Redeploy на конкретной карточке деплоя пересобирает **тот же коммит**, на
котором эта карточка изначально стояла (в нашем случае — старый, задолго до PR #7),
а не подтягивает свежий HEAD ветки `main`.
**Формула проверки:**
```bash
# Deployments → открыть активный деплой → сверить короткий хэш с:
git rev-parse --short origin/main
# Если не совпадает — это не редеплой актуального кода.
```
**Фикс:** не полагаться на Redeploy зависшей карточки. Либо явно выбрать "Deploy latest commit"
для ветки `main`, либо запушить любой реальный коммит, трогающий `apps/landing/**` — сработает
`watchPatterns` + "Auto deploys when pushed to GitHub" (Settings → Source), и Railway соберёт
актуальный HEAD сам.

---

## Главная команда перед push

```bash
cd apps/landing && npx tsc --noEmit && echo "✅ TypeScript OK" || echo "❌ TypeScript errors"
```

Если видишь `✅ TypeScript OK` — можно пушить.

---

# Возобновление после оплаты Railway (состояние на 03.08.2026)

Билды заморожены: триал TezCode Team истёк, подписка не оплачена, сервис `landing`
под **Limited Access**, деплой от 31.07 висит в `INITIALIZING` 73+ часов. Прод отдаёт
сборку от **29.07**. Всё, что ниже, готово и ждёт только оплаты.

Порядок важен: шаг 2 без шага 3 даст молча пустую аналитику.

### 1. Оплатить план

Railway → проект `savdo builder` → Billing. Финансовое действие команды.
После оплаты убедиться, что баннер Limited Access на сервисе `landing` пропал.

### 2. Влить контент

PR **#7** (`seo/landing-aeo-geo-2026-07-30` → `main`) — 6 гайдов, `/faq`, sitemap на
28 URL, AEO/GEO-разметка, плюс страницы из `main`. Ветка уже смержена с `main`
(0 позади), `tsc` и `next build` зелёные.

Перед merge — два открытых вопроса в описании PR: пять FAQ-ответов лежат в
`faqCategories` и никуда не смаршрутизированы, и в шапке стало 8 пунктов навигации.

### 3. Задать переменные в Railway → сервис `landing` → Variables

Код уже прокидывает их как build args (`railway.toml [build.args]` + `Dockerfile ARG/ENV`),
без значений скрипты просто не рендерятся:

| Переменная | Откуда берётся |
|---|---|
| `NEXT_PUBLIC_GA_ID` | GA4 → Admin → Data streams → `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_YANDEX_METRICA_ID` | Метрика → номер счётчика, только цифры |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | GSC → Settings → Ownership → HTML tag |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | Вебмастер → Права доступа → Мета-тег |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster (веб-поиск ChatGPT читает индекс Bing) |

GA4-аккаунта на 03.08 ещё нет — заводить под владельцем, не под личной почтой.

### 4. Новый деплой, не рестарт

`NEXT_PUBLIC_*` инлайнятся Next.js **на этапе сборки**. Рестарт переменные не подхватит.

### 5. Проверить живьём — не «выглядит нормально», а по фактам

```bash
curl -sI https://maxsavdo.uz/qollanma | head -1          # 200, не 404
curl -s https://maxsavdo.uz/sitemap.xml | grep -c "<loc>" # 28
curl -sI https://maxsavdo.uz/about | head -1             # 200 — страница из main
curl -s https://maxsavdo.uz/ | grep -c "googletagmanager" # 1, если GA_ID задан
```

Если `/qollanma` отдаёт 200, а `/about` — 404 (или наоборот), задеплоена не та ветка.
Это уже случалось трижды: `LANDING-BRANCH-DRIFT-001`, `LANDING-BRANCH-STALE-002`,
`LANDING-SEO-CONTENT-NOT-DEPLOYED-001`.

### 6. После выката

- GSC → **URL Inspection** по `/qollanma` и `/faq` → «Запросить индексирование».
  Отчёт «Индексирование → Страницы» около недели отвечает «данные обрабатываются»
  и будет бесполезен, пока URL всего два — Inspection отвечает сразу.
- Core Web Vitals перемерить заново: 3.0s LCP были сняты со сборки 29.07, а хиро
  с тех пор переписан (`a1da3da8`) и картиночных preload'ов в нём больше нет.
- CrUX обновляется 28-дневным скользящим окном — раньше чем через несколько недель
  поля не появятся, и на таком трафике их может не быть вовсе.
