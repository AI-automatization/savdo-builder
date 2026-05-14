# Savdo — Logos

| Файл | Размер base | Назначение |
|------|------------|-----------|
| `savdo-mark.svg` | 64×64 | **Primary mark.** Brand gradient (violet→cyan). App icon, favicon, social avatar. |
| `savdo-wordmark.svg` | 240×64 | **Mark + text.** Header, email signature, hero. |
| `savdo-buyer.svg` | 64×64 | **Buyer sub-brand.** Orchid violet (`#A855F7→#EC4899`). TMA buyer, Instagram-ads для покупателей. |
| `savdo-seller.svg` | 64×64 | **Seller sub-brand.** Cyan (`#06B6D4→#22D3EE`). Storefront иллюстрация. CRM, seller landing. |
| `savdo-admin.svg` | 64×64 | **Admin internal.** Indigo + dark navy. Shield-форма (audit/security). |
| `savdo-mark-mono.svg` | 64×64 | **Mono version.** Заливка = `currentColor` → перекрашивается через CSS. Печать, 1-цветная реклама, favicon ≤32px. |

---

## Clear space

Вокруг лого — минимум **¼ ширины mark'а** свободного места.
Для `savdo-mark.svg` (64×64) — clear-space 16px со всех сторон.

## Минимальные размеры

| Контекст | Min |
|----------|-----|
| Favicon | 16×16 (используй mono-версию) |
| App icon | 48×48 (color) |
| Header logo | 32×32 |
| Hero / Landing | 80×80+ |
| Print / Marketing | 200×200+ |

## Использование в коде

### Next.js / React
```tsx
import Logo from '@/assets/savdo-mark.svg';

<Logo className="w-10 h-10" aria-label="Savdo" />
```

### HTML / static
```html
<img src="/logos/savdo-mark.svg" alt="Savdo" width="40" height="40" />
```

### Tailwind colored (mono version)
```tsx
<div className="text-violet-600">
  <Logo />  {/* mono SVG автоматически возьмёт текущий color */}
</div>
```

## Telegram-specific

**@savdo_builderBOT avatar** — `savdo-mark.svg` 512×512.
Конвертация: `inkscape savdo-mark.svg --export-png=avatar.png -w 512 -h 512`.

**Channel post header** — wordmark + 1-line description.

## Что НЕ делать

- ❌ НЕ растягивать (только uniform scale)
- ❌ НЕ менять цвета внутри `#savdoBrand` gradient
- ❌ НЕ добавлять drop-shadow / stroke вокруг
- ❌ НЕ ставить лого на bg < AA contrast (3:1 minimum для logo)
- ❌ НЕ rotate'ить
- ❌ НЕ использовать sub-brand (buyer/seller) в нейтральном контексте — только primary mark
