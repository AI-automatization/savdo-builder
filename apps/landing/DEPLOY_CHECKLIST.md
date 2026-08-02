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

## Главная команда перед push

```bash
cd apps/landing && npx tsc --noEmit && echo "✅ TypeScript OK" || echo "❌ TypeScript errors"
```

Если видишь `✅ TypeScript OK` — можно пушить.
