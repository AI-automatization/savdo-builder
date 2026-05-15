# Savdo — Color Palette

> Полная палитра по всем 3 sub-системам. Источник истины:
> `apps/admin/src/index.css`, `apps/tma/src/index.css`,
> `apps/web-buyer/src/app/globals.css`, `apps/web-seller/src/app/globals.css`.

---

## 1. Primary Brand Accents — по контексту

| Контекст | HEX | RGB | HSL | Назначение |
|----------|-----|-----|-----|------------|
| **TMA Buyer** | `#A855F7` | `168, 85, 247` | `271°, 91%, 65%` | Orchid Violet — энергия, retail, эмоция |
| **TMA Seller** | `#22D3EE` | `34, 211, 238` | `187°, 86%, 53%` | Cyan — деловой, информативный |
| **Web Buyer** | `#7C3F2E` | `124, 63, 46` | `13°, 46%, 33%` | Terracotta — тёплый, доверительный |
| **Web Seller** | `#7C3AED` | `124, 58, 237` | `260°, 84%, 58%` | Violet — продуктивный |
| **Admin** | `#818CF8` | `129, 140, 248` | `234°, 89%, 74%` | Indigo — нейтрально-технический |

**Light theme overrides:**
- TMA Buyer (light): `#7C3AED` (тот же violet что web-seller)
- TMA Seller (light): `#0891B2` (deeper cyan для контраста на белом)
- Admin (light): `#818CF8` остаётся (достаточно тёмный)

---

## 2. Semantic Colors — единые для всех контекстов

| Семантика | HEX (dark) | HEX (light) | Назначение |
|-----------|------------|-------------|------------|
| ✅ **Success** | `#22C55E` | `#16A34A` | Подтверждено, отправлено, успех |
| ⚠️ **Warning** | `#F59E0B` | `#D97706` | Внимание, in-progress, неуверенность |
| ❌ **Error / Danger** | `#EF4444` | `#DC2626` | Ошибка, отмена, удаление |
| ℹ️ **Info** | `#2563EB` | `#2563EB` | Информация, ссылки |

В TMA — кастомные оттенки для glass-эффекта:
- Success: `#34D399` (зеленее) / Warning: `#FBBF24` (жёлтее) / Danger: `#EF4444` (стандарт)

---

## 3. Surface / Background — по контексту

### TMA (dark default)
```
--tg-bg:             #0B0E14   (deep navy, almost black)
--tg-surface:        rgba(255,255,255,0.055) (glass overlay)
--tg-surface-hover:  rgba(255,255,255,0.08)
--tg-border:         rgba(255,255,255,0.11)
```

### TMA (light)
```
--tg-bg:             #F7F8FB
--tg-surface:        rgba(0,0,0,0.04)
--tg-text-primary:   rgba(0,0,0,0.88)
```

### Admin (dark default)
```
--bg:        #0F172A   (slate-900)
--surface:   #1E293B   (slate-800)
--surface2:  #253347   (slate-700-ish)
--border:    #334155   (slate-600)
--text:      #F1F5F9   (slate-100)
```

### Admin (light)
```
--bg:        #F8FAFC   (slate-50)
--surface:   #FFFFFF
--surface2:  #F1F5F9   (slate-100)
--text:      #0F172A   (slate-900)
```

### Web-buyer (Soft Color Lifestyle — warm light)
```
--color-bg:               #FBF7F0   (cream beige)
--color-surface:          #FFFFFF
--color-surface-sunken:   #F4EEE0
--color-text-primary:     #1F1A12   (deep brown)
--color-text-body:        #3D3525
--color-divider:          #EFE8DA
--color-brand:            #7C3F2E   (terracotta)
--color-brand-hover:      #6A3526
```

### Web-seller (Liquid Authority — cool light/dark)
```
--color-bg:               #F4F5F7   (cool grey)
--color-surface:          #FFFFFF
--color-surface-sunken:   #E4E7EB
--color-text-primary:     #0F172A
--color-accent:           #7C3AED   (violet)
```

---

## 4. Text Hierarchy — стандарт во всех системах

| Уровень | TMA dark | TMA light | Admin dark | Admin light |
|---------|----------|-----------|------------|-------------|
| **Primary** | `rgba(255,255,255,0.90)` | `rgba(0,0,0,0.88)` | `#F1F5F9` | `#0F172A` |
| **Secondary** | `rgba(255,255,255,0.55)` | `rgba(0,0,0,0.62)` | — | — |
| **Muted** | `rgba(255,255,255,0.40)` | `rgba(0,0,0,0.45)` | `#94A3B8` | `#64748B` |
| **Dim** | `rgba(255,255,255,0.30)` | `rgba(0,0,0,0.28)` | `#475569` | `#94A3B8` |

---

## 5. Accessibility — WCAG 2.1 контраст

Проверено для primary text на surface (4.5:1 AA для тела, 3:1 AA для крупного):

| Pair | Ratio | WCAG |
|------|-------|------|
| TMA dark — primary text on `#0B0E14` | 18.5:1 | AAA |
| TMA light — primary text on `#F7F8FB` | 16.2:1 | AAA |
| Admin dark — `#F1F5F9` on `#0F172A` | 16.0:1 | AAA |
| Admin light — `#0F172A` on `#FFFFFF` | 17.1:1 | AAA |
| Web-buyer — `#1F1A12` on `#FBF7F0` | 14.3:1 | AAA |
| Web-seller — `#0F172A` on `#FFFFFF` | 17.1:1 | AAA |

Brand accents на стандартном bg — все ≥4.5:1 AA для UI text.

**Disabled / Dim text** не должен использоваться для критичной информации
— только для timestamps, помощников, decorative meta.

---

## 6. Использование в коде

**TMA:** через CSS-vars `var(--tg-accent)`, `var(--tg-text-primary)` etc.
**Admin:** через CSS-vars + Tailwind utility (`bg-zinc-800` → перенесены в `.btn-*` / `.badge-*` классы).
**Web:** через CSS-vars в `globals.css` + Azim'овские helpers `dangerTint(o)` / `warningTint(o)` / `successTint(o)`.
**Admin:** mirror через `apps/admin/src/lib/styles.ts`.

**НЕ хардкодить** `rgba(...)` в JSX — всегда через var.

---

## 7. Gradients — only on brand-mark surfaces

Используем только в:
- Логотипе (см. [LOGOS/](LOGOS/))
- Avatar fallback (auth'д пользователь)
- Hero-блок landing-страницы

| Gradient | Stops | Где |
|----------|-------|-----|
| **Buyer hero** | `linear-gradient(135deg, #A855F7 0%, #EC4899 100%)` | TMA buyer onboarding |
| **Seller hero** | `linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)` | TMA seller MainButton |
| **Auth'д avatar** | `linear-gradient(135deg, #059669 0%, #34D399 100%)` | Profile-карточка |
| **Savdo brand** | `linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)` | Combined buyer+seller — для marketing |
