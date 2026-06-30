---
date: 2026-05-30
project: maxsavdo
status: 🟢 актуальный — источник правды по дизайн-системе
supersedes: docs/design/liquid-authority.md (Liquid Authority v1.0, violet/slate)
related: docs/brand/maxsavdo-brand-v2.md (ADR-008), docs/adr/ADR-009
---

# maxsavdo — Design System v2 (Dark Luxury Minimalist)

> **Обязательно к прочтению** для всех агентов, работающих над UI (web-buyer, web-seller, admin).
> Единственный источник правды по дизайн-системе. Заменяет `liquid-authority.md` (deprecated).
>
> **Палитра, логотип, типографика — не дублируются здесь.** Их канонический источник —
> [`docs/brand/maxsavdo-brand-v2.md`](../brand/maxsavdo-brand-v2.md). Этот документ — про
> **применение** бренда в UI: концепцию, паттерны компонентов, spacing, UX-правила.

---

## Концепция

**Dark Luxury Minimalist.** Премиальный, спокойный, высоко-контрастный. Много negative
space, золото — точечно. Не игривый, не геймифицированный, без тяжёлого glassmorphism.

Две поверхности, один бренд — разная плотность:

| Поверхность | Тон | Ориентир |
|-------------|-----|----------|
| **web-buyer (storefront)** | Brand-forward, воздух, premium-витрина | Apple / премиум-ритейл |
| **web-seller + admin (dashboard)** | Функциональный, data-dense, fast-scanning | Linear / Stripe Dashboard, но в maxsavdo-палитре |

> Buyer-витрина продаёт впечатление; seller/admin-панель продаёт скорость работы.
> Обе используют одни токены (`docs/brand/maxsavdo-brand-v2.md` §5), но storefront даёт
> больше воздуха и крупнее hero, а dashboard — плотнее и таблично.

---

## Цвет — как применять (источник HEX: brand-v2 §2)

- **Background / text** — Rich Black `#0A0A0A` ↔ Pure White `#FFFFFF` (инверсия по теме).
- **Accent / CTA / активные состояния** — Champagne Gold `#C9A876`. Золото — **дефицитный
  ресурс**: одна главная золотая CTA на экран, остальное нейтрали. Перебор золота убивает premium.
- **Surfaces / borders** — нейтрали из brand-v2 §2 «Supporting» (`#1A1A1A`/`#2A2A2A`/`#3A3A3A`
  на dark, `#F8F8F8`/`#E5E5E5` на light).
- **Статусы** — functional из brand-v2 §2 (`success #10B981`, `warning #F59E0B`,
  `error #EF4444`, `info #3B82F6`). Подобраны так, чтобы не конкурировать с золотом.

**Default темы web-buyer = `system`** (см. [ADR-009](../adr/ADR-009_web_buyer_default_theme_system.md)).
web-seller default = `dark` (CRM-identity). Переключение — через `data-theme` на `<html>` +
CSS-переменные (НЕ `dark:`-класс Tailwind отдельно). Семантические токены:
`--bg-primary`, `--bg-surface`, `--text-primary`, `--text-secondary`, `--accent`, `--border`
(см. brand-v2 §5).

---

## Типографика

**Inter** (один шрифт на всё, weights 300–700, subsets latin+latin-ext+cyrillic+cyrillic-ext)
— см. brand-v2 §3. Wordmark в header — SVG `<MaxsavdoLogo>`, не текст шрифта.

Scale (brand-v2 §3): Display 48/700 · H1 32/700 · H2 24/600 · H3 20/600 · Body 16/400 ·
Caption 14/500 · Small 12/400.

---

## Компоненты

### Кнопки

| Вариант | Применение |
|---------|------------|
| **Primary** | Заполненный Champagne Gold `--accent`, тёмный текст. **Одна на экран** (главная CTA). |
| Secondary | Нейтральный surface, текст `--text-primary`. Вторичные действия. |
| Outline | Прозрачный фон, граница `--accent` или `--border`. |
| Ghost | Только текст, без фона/границы. Tertiary / иконочные действия. |

### Инпуты
- Тонкая граница (`--border`), focus — кольцо `--accent`. Без тяжёлых теней.
- Высота 40px (`h-10`), radius `md`.

### Карточки / секции
- Фон `--bg-surface`, тонкая граница `--border`.
- `border-radius`: storefront — мягкий (12px); dashboard — sharp/medium (8px).
- Тени мягкие, глубина ≤ 8px. На dark — едва заметные.

### Таблицы (dashboard)
- Без зебры — только hover-highlight. Чёткое разделение строк через `--border`.
- Padding ячейки 12×16px. Tabular-nums для чисел/цен.

### Навигация
- Buyer: bottom nav (mobile-first) + минимальный top header с лого.
- Seller/admin: left sidebar + top bar. Активный пункт — `--accent` фон 15% opacity.

### Иконки
- Lucide React (line icons). Размер кратен 4 (16/18/20). Декоративные — `aria-hidden`.

---

## Spacing (8px grid)

```
4 xs · 8 sm · 12 md · 16 base · 24 lg · 32 xl · 48 2xl · 64 3xl
```
Все padding/gap/margin кратны 4px.

---

## UX-принципы

- **Storefront:** первое впечатление = доверие. Читаемость фото товара выше «брендовости»
  фона (причина дефолта `system`, не форс-dark — ADR-009). Быстрый путь к товару и корзине.
- **Dashboard:** fast scanning — данные считываются за секунды. Один главный CTA на экран.
- **Везде:** no visual noise, consistent 8px spacing, золото только там, где зовём к действию.
- **Доступность:** контраст AA минимум; `role`/`aria` на интерактиве; focus-видимость.

---

## Запрещено

- Glassmorphism overload (backdrop-blur на каждом элементе).
- Неоновые градиенты, пёстрые/пастельные цвета, **фиолетовый** (наследие старой системы).
- ~~Cream / terracotta фоны~~ (Soft Color Lifestyle — отменён).
- Золото большими плоскостями / как фон контента (только accent/CTA).
- Сложные анимации (только transition 150–200ms ease). Тени глубиной > 8px.
- «S»-монограмма старого бренда (brand-v2 §1).

---

## Реализация в коде

Токены и CSS-переменные — канонически в [`maxsavdo-brand-v2.md` §5](../brand/maxsavdo-brand-v2.md).
В web-buyer/web-seller палитра уже внедрена в `globals.css` (см. `BRAND-WEB-COLOR-TOKENS-001`,
закрыт 25.05.2026). Компоненты читают семантические токены → автоматически следуют теме.

> Логотип в коде — inline `<MaxsavdoLogo>` SVG (split-color M + handle). Финальный
> vectorized-SVG ждёт `BRAND-LOGO-SVG-CREATE-001`; API компонента при swap не меняется.

---

## Что изменилось vs Liquid Authority v1.0

| Liquid Authority v1.0 | maxsavdo Design v2 |
|------------------------|---------------------|
| Primary violet `#818CF8` | **Champagne Gold `#C9A876`** (accent, дефицитный) |
| BG slate `#0F172A` / `#F8FAFC` | **Rich Black `#0A0A0A` / Pure White `#FFFFFF`** |
| Один тон «admin/dashboard» | **Две поверхности:** storefront (brand-forward) + dashboard (functional) |
| Шрифт Inter/Geist | **Inter** (один, full Cyrillic) |
| — | Default темы зафиксированы (ADR-009: buyer `system`, seller `dark`) |

Сохранено из v1.0: 8px grid, component-паттерны, fast-scanning для dashboard,
data-theme switching через CSS-переменные, запрет glassmorphism/тяжёлых теней/анимаций.

---

## Связано

- [Brand Book v2](../brand/maxsavdo-brand-v2.md) — палитра, лого, типографика (источник)
- [ADR-008](../adr/ADR-008_brand_name_maxsavdo.md) — бренд maxsavdo
- [ADR-009](../adr/ADR-009_web_buyer_default_theme_system.md) — default theme `system`
- [liquid-authority.md](./liquid-authority.md) — предыдущая система (deprecated)

*maxsavdo Design System · v2.0 · 30.05.2026*
