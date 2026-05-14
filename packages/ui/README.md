# @savdo/ui

Shared components + design tokens для всех приложений Savdo.

## Components

### `<PhoneInput>` — UZ phone input с маской `+998 XX XXX XX XX`

Перенесён из `apps/web-buyer/src/components/PhoneInput.tsx` и
`apps/web-seller/src/components/PhoneInput.tsx` (дубль) в shared package.

**API:**
```tsx
import { PhoneInput, formatUzPhone, stripUzPhone, isValidUzPhone } from '@savdo/ui';

<PhoneInput
  value={phone}           // E.164 формат: '+998901234567'
  onChange={setPhone}     // onChange получает E.164
  onEnter={handleSubmit}  // Enter key
  ariaLabel="Телефон"
  placeholder="+998 90 000 00 00"
/>
```

**Utils** доступны отдельно:
```tsx
formatUzPhone('+998901234567')  // → '+998 90 123 45 67'
stripUzPhone('+998 90 123 45 67') // → '+998901234567'
isValidUzPhone('+998901234567')   // → true (длина 12 + starts with 998)
```

---

## Установка

### 1. Подключить как workspace dep

В `apps/<your-app>/package.json`:
```json
{
  "dependencies": {
    "@savdo/ui": "workspace:*"
  }
}
```

Затем `pnpm install` из корня монорепо.

### 2. Импорт

#### Vite (TMA, admin)
```tsx
import { PhoneInput } from '@savdo/ui';
```

#### Next.js (web-buyer, web-seller)
PhoneInput — клиентский компонент (use forwardRef/useCallback).
Next.js нужен `'use client'`. Сделай обёртку в своём приложении:

```tsx
// apps/web-buyer/src/components/ui/PhoneInput.client.tsx
'use client';
export { PhoneInput, formatUzPhone, stripUzPhone, isValidUzPhone } from '@savdo/ui';
```

Затем импортируй из локальной обёртки.

---

## Tokens

`@savdo/ui/tokens/colors.ts` — 4 варианта палитр (legacy от первоначального
дизайн-исследования). **Не используется в продакшене** — actual палитры в
`apps/*/src/index.css` или `apps/*/src/app/globals.css`. Документация —
в `business/COLORS.md`.

---

## Migration plan (для Азима, web-buyer + web-seller)

После подключения `@savdo/ui` через `workspace:*`:

1. Удалить `apps/web-buyer/src/components/PhoneInput.tsx`
2. Удалить `apps/web-seller/src/components/PhoneInput.tsx`
3. Заменить импорты:
   ```diff
   - import { PhoneInput, formatUzPhone } from '@/components/PhoneInput';
   + import { PhoneInput, formatUzPhone } from '@/components/ui/PhoneInput.client';
   ```
4. Прогнать `pnpm tsc --noEmit` в обоих апсах.

Аналогично для admin/TMA — но они на Vite, обёртка не нужна.

---

## Что НЕ делать

- ❌ НЕ добавлять `'use client'` директиву в файлы packages/ui — это сделает
  Next.js consumer через обёртку
- ❌ НЕ зависеть от React Router / Next.js Link — компоненты должны быть
  router-agnostic
- ❌ НЕ импортировать CSS файлы здесь — это сделают consumers (через свои
  globals.css или index.css)
