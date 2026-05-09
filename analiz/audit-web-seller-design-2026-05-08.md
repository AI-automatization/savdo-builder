# web-seller design audit — 08.05.2026

> Read-only аудит `apps/web-seller` против `docs/design/liquid-authority.md`.
> Проводил Claude (сессия 54) делегацией code-explorer. Финальная сводка
> и тикеты — см. `analiz/tasks.md` секция «WEB-SELLER-DESIGN-AUDIT-2026-05-08».

## Summary

- Файлов проверено: 15 страниц + 7 компонентов
- P1 (видимые баги / контраст / accessibility): **7**
- P2 (drift / inconsistency / off-grid): **14**
- P3 (polish): **9**
- Overall health: **6.5/10** — token discipline хороший в целом (Phase 2/3 cleanup
  держится: 0 `backdrop-blur`, 0 `dark:` Tailwind), но кластер хардкоженных hex
  в edit-product и chat, три `confirm()` нативных диалога, drift радиусов
  card'ов между create vs edit, и протекание `text-white` / `bg-white/*` Tailwind
  не дают подняться выше.

---

## P1 — visible UX bugs / broken states / contrast / accessibility

**[WS-DESIGN-P1-001] `confirm()` native dialog на destructive actions — 3 места**
- `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx:197`
- `apps/web-seller/src/components/product-option-groups-section.tsx:136,205`
- `apps/web-seller/src/components/product-variants-section.tsx:344`

Native browser `confirm()` рендерит OS-modal, игнорирующий тему, на mobile WebView часто silently заблокирован. Уже есть `CancelModal` в orders/[id] — нужно унифицировать.

**[WS-DESIGN-P1-002] Хардкоженные `#f87171` и `#A78BFA` в edit product**
- `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx:239,243,358,382,514`

`#f87171` = dark-mode `colors.danger` (light = `#DC2626`); `#A78BFA` = dark-mode
`colors.accent` (light = `#7C3AED`). На light-теме UI ломается — error-text
становится мутно-розовым, accent-back-link не на бренд-цвете.

**[WS-DESIGN-P1-003] `rgba(255,255,255,X)` inline в chat edit textarea**
- `apps/web-seller/src/app/(dashboard)/chat/page.tsx:329,336,360`

Три инстанса `rgba(255,255,255,0.18/.16/.65)` в edit mode message bubble.
В light theme — невидимое white-on-white. Phase 2/3 cleanup пропустил эту
ветку (она inside conditional render).

**[WS-DESIGN-P1-004] `text-white` Tailwind на avatar upload spinner**
- `apps/web-seller/src/app/(dashboard)/profile/page.tsx:116`

`<Loader2 className="animate-spin text-white">` поверх `rgba(0,0,0,0.45)`
overlay. В light theme при светлом аватаре spinner едва виден. Заменить на
inline `style={{ color: colors.accentTextOnBg }}`.

**[WS-DESIGN-P1-005] `after:bg-white` на toggle knob в edit product**
- `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx:419`

В light theme thumb сливается с track surface. Create page (line 326) делает
правильно через `<style>` injection с tokens. Edit регрессировал.

**[WS-DESIGN-P1-006] Sidebar logo — хардкоженный gradient + glow**
- `apps/web-seller/src/app/(dashboard)/layout.tsx:76-77`

`linear-gradient(135deg, #7C3AED, #A78BFA)` + `boxShadow: '0 4px 14px rgba(167,139,250,.40)'`.
В light theme — тяжёлая неоновая «лужа» на белом sidebar. Спека Liquid
Authority явно запрещает «glow gradients». Onboarding logo (line 588) уже
сделан правильно через `colors.accent`.

**[WS-DESIGN-P1-007] `hover:bg-white/[0.03]` — невидимый hover в light**
- `apps/web-seller/src/app/(dashboard)/profile/page.tsx:243,257`
- `apps/web-seller/src/app/(dashboard)/layout.tsx:171`

3% white поверх белого = visual no-op. Settings/Logout rows в profile + кнопка
выхода в sidebar — нет feedback при hover в light theme.

---

## P2 — system inconsistency / drift / off-grid

**[WS-DESIGN-P2-001] Radius mismatch create vs edit product**
- create: `rounded-lg` (8px) на main card; edit: `rounded-2xl` (16px). Spec — 12px (`rounded-xl`). Оба отклоняются и расходятся между собой.

**[WS-DESIGN-P2-002] `#60A5FA` (Tailwind blue-400) хардкожен — не в tokens**
- `orders/page.tsx:14`, `orders/[id]/page.tsx:14`, `dashboard/page.tsx:17`, `products/page.tsx:266,348`, `analytics/page.tsx:188`

Используется для CONFIRMED order status и для Telegram-link icons. Нет «info» semantic token в styles.ts. Также непоследовательно: в orders применяется к CONFIRMED, в analytics — к TG-buttons.

**[WS-DESIGN-P2-003] `#818CF8` хардкожен как SHIPPED status color**
- `orders/page.tsx:16`, `orders/[id]/page.tsx:16`

То же что P2-002, отдельно потому что разный hex.

**[WS-DESIGN-P2-004] Native `<select>` в edit product с `background: '#1a1d2e'`**
- `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx:321,323,346,348`

Create использует custom `<Select>` (`components/select.tsx`), edit регрессировал на native с хардкоженным dark-only фоном. Также теряем custom keyboard nav и accessibility.

**[WS-DESIGN-P2-005] TITLE_EXAMPLES_BY_SLUG / DESCRIPTION_EXAMPLES_BY_SLUG дублируется**
- `create/page.tsx:18-49` ↔ `edit/page.tsx:18-49`

Сам комментарий в edit просит вынести в `lib/product-examples.ts` когда список вырастет. Maintenance trap.

**[WS-DESIGN-P2-006] Toast/popover shadow > 8px (spec violation)**
- `layout.tsx:342` — `0 12px 28px rgba(0,0,0,0.45)`
- `select.tsx:170` — `0 16px 40px ...`
- `emoji-picker.tsx:97` — `0 16px 40px ...`

Spec прямо запрещает «тени глубиной > 8px».

**[WS-DESIGN-P2-007] Sidebar active item — не «15% opacity primary» из spec'а**
- `layout.tsx:99`

Реализовано через `accentMuted` (10-14%) + `accentBorder`. Spec: `--color-primary` 15% opacity без рамки. Отклонение задокументировано.

**[WS-DESIGN-P2-008] Onboarding `rounded-3xl` (24px); spec card max — 12px**
- `onboarding/page.tsx:581`

Также внутри файла смешаны xl/2xl/3xl. Acceptable если onboarding — это distinct «scene» (spec разрешает sanctioned orbs там), но самосогласованность нужна.

**[WS-DESIGN-P2-009] Onboarding — хардкоженные `#A78BFA` и `#fff`**
- `onboarding/page.tsx:426,422,588`

Storename span + Lucide icon `color="#fff"` props. Заменить на `colors.accent` и `colors.accentTextOnBg`.

**[WS-DESIGN-P2-010] Login OTP step copy: «Код из SMS» / «Отправили SMS»**
- `apps/web-seller/src/app/(auth)/login/page.tsx:142,146-147`

Project rule №0 — ESKIZ.UZ ЗАПРЕЩЁН, OTP только Telegram Bot. Копи противоречит реальности и project rule. Заменить на «Код из Telegram бота» / «Отправили код в @savdo_builderBOT».

**[WS-DESIGN-P2-011] Chat layout `h-[calc(100vh-10rem)]` — off-grid + не responsive**
- `chat/page.tsx:485`

`10rem` ≠ кратно 8px. Также нет mobile fallback (см. P3-009).

**[WS-DESIGN-P2-012] Notification row: hover-leave устанавливает accent (не наоборот)**
- `notifications/page.tsx:53-55`

`onMouseLeave → colors.accentMuted` для unread, `onMouseEnter → colors.surfaceElevated`. Семантика инвертирована: highlighted state выходит как rest, не hover.

**[WS-DESIGN-P2-013] Telegram-link chip в profile — `#7dd3fc` / sky-300 хардкожен**
- `profile/page.tsx:169`

Нет «telegram blue» token в styles.ts. См. также P2-002.

**[WS-DESIGN-P2-014] Page headings — `text-xl` (20px), spec Headline 24-32px**
- `analytics/page.tsx:223`, `orders/page.tsx:329`, `products/page.tsx:91`, `notifications/page.tsx:110`, `settings/page.tsx:792`

Все основные заголовки страниц на 4px ниже спеки. Только `dashboard/page.tsx:90` правильно с `text-2xl` (24px).

---

## P3 — polish / nitpicks

- **[WS-DESIGN-P3-001]** `layout.tsx:316` notification badge `fontSize: 9` — sub Label-min (12px).
- **[WS-DESIGN-P3-002]** `chat/page.tsx:513-522` нет skeleton для thread items beyond hardcoded 3.
- **[WS-DESIGN-P3-003]** `theme-toggle.tsx:79` — `shadow-lg` + inline `boxShadow` оба, конфликт.
- **[WS-DESIGN-P3-004]** `emoji-picker.tsx:132` — `hover:bg-white/5` (см. P1-007 для родственных).
- **[WS-DESIGN-P3-005]** `onboarding/page.tsx:107` — progress connector 1px `surfaceElevated`, едва видно в light.
- **[WS-DESIGN-P3-006]** `settings/page.tsx:365,649` — native `<select>` с `appearance:none` без custom chevron, в Firefox visual breakage.
- **[WS-DESIGN-P3-007]** `analytics/page.tsx:311` — `— ` ASCII-divider как text decoration; лучше `<hr>` через `colors.divider`.
- **[WS-DESIGN-P3-008]** `analytics/page.tsx:56` KpiCard `text-3xl` (30px) — в спеке OK, но `text-xs` units на metadata-уровне может быть мелко.
- **[WS-DESIGN-P3-009]** `chat/page.tsx:485-488` — нет mobile responsive layout, `w-72` thread list + flex-1 chat = overflow на phone.

---

## Token discipline summary

- **Хардкоженные hex/rgba: 19 distinct instances**
  - Top: `products/[id]/edit/page.tsx` (7), `orders/page.tsx` (2), `orders/[id]/page.tsx` (2), `onboarding/page.tsx` (3), `analytics/page.tsx` (1), `profile/page.tsx` (1), `dashboard/page.tsx` (1).
  - Recurring: `#60A5FA` ×6, `#818CF8` ×2, `#f87171` ×3, `#A78BFA` ×2.
- **`backdrop-blur`: 0** ✅ Phase 2/3 cleanup держится.
- **`rgba(255,255,255,X)` inline: 3** — все в `chat/page.tsx` edit mode (см. P1-003).
- **`text-white` / `bg-white/*` classes: 4** — `profile/page.tsx` (×2), `layout.tsx` (×1), `product-variants-section.tsx` (×1).
- **`dark:` Tailwind: 0** ✅ полностью respected, theme через CSS vars.

---

## Page-by-page health

| Page | P1 | P2 | P3 | Worst issue |
|------|----|----|----|-------------|
| root (redirect) | 0 | 0 | 0 | — |
| login | 0 | 1 | 0 | SMS copy contradicts Telegram-only OTP rule |
| onboarding | 0 | 2 | 1 | Хардкоженные #A78BFA/#fff, radius drift (rounded-3xl) |
| dashboard/layout | 2 | 1 | 1 | Sidebar logo gradient + glow (P1) |
| dashboard | 0 | 1 | 0 | `#60A5FA` для CONFIRMED status |
| products list | 0 | 1 | 0 | `#60A5FA` TG-link, heading too small |
| products/create | 0 | 1 | 0 | Heading `text-xl`, mixed radius vs edit |
| **products/[id]/edit** | **3** | **2** | **0** | Хардкож + broken toggle thumb + native `<select>` |
| orders list | 0 | 2 | 0 | Хардкож status colors, shadow-2xl |
| orders/[id] | 0 | 1 | 0 | Хардкож status colors |
| chat | 1 | 2 | 1 | rgba(255,255,255,X) edit mode, no mobile layout |
| analytics | 0 | 2 | 1 | `#60A5FA` + `text-xl` heading |
| notifications | 0 | 1 | 0 | Hover-leave inverted semantics |
| profile | 1 | 2 | 0 | text-white spinner, bg-white/0.03 hover, TG chip |
| settings | 1 | 1 | 1 | text-xl heading, Firefox `<select>` chevron |
| select.tsx | 0 | 1 | 0 | Shadow > 8px |
| emoji-picker.tsx | 0 | 1 | 1 | Shadow > 8px, hover:bg-white/5 |
| image-uploader.tsx | 0 | 0 | 0 | ✅ Clean |
| display-type-selector.tsx | 0 | 0 | 0 | ✅ Clean |
| product-option-groups.tsx | 1 | 0 | 0 | confirm() native dialogs |
| product-variants.tsx | 1 | 0 | 1 | confirm(), after:bg-white toggle |
| theme-toggle.tsx | 0 | 1 | 1 | Shadow > 8px, redundant shadow-lg + inline |

---

## Predлagaemый порядок фиксов (если возьмёмся)

Грубо по «возврат на инвестиции» — что максимально чинит UX за минимум работы:

1. **Wave 1 — light-theme contrast killers (P1-002, P1-003, P1-004, P1-005, P1-006, P1-007)**
   Один проход по 4 файлам, заменить хардкоженный hex и `*-white` на токены.
   Result: light theme больше не ломается на edit/chat/profile/sidebar.

2. **Wave 2 — `confirm()` → CancelModal (P1-001)**
   3 места × ~10 строк = маленький рефактор. Заодно унифицирует UX
   destructive-actions через всё приложение.

3. **Wave 3 — page heading typography (P2-014)**
   5 файлов × `text-xl` → `text-2xl` (или 3xl). Single-line search/replace, поднимает соответствие spec'у.

4. **Wave 4 — login SMS copy (P2-010)**
   Project rule violation. ~3 строки текста.

5. **Wave 5 — status color tokens (P2-002, P2-003, P2-013)**
   Добавить semantic info-blue token в styles.ts + globals.css, заменить ×8 хардкоженных мест.

6. **Wave 6 — products edit dragons (P2-001, P2-004, P2-005)**
   Самый крупный рефактор: радиус-выравнивание create↔edit, замена native `<select>` на custom `<Select>`, вынос examples в shared file. Может превратиться в отдельную сессию.

7. Остальные P2 + все P3 — backlog.

---

*Аудит готов. Никакого кода не тронуто. Жду решения Азима — какие waves брать.*
