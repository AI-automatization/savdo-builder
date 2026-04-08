# Design Style: "Liquid Authority"

> **Обязательно к прочтению** для всех агентов, работающих над UI (web-buyer, web-seller, admin).
> Это единственный источник правды по дизайну. Не отходить от системы без явного ОК от Полата.

---

## Концепция

Чистый, современный, профессиональный admin/dashboard UI.
Ориентир: **Shopify Admin** / **Stripe Dashboard**.

- Минималистичный
- Высокий контраст
- Профессиональный — НЕ игривый, НЕ геймифицированный
- Фокус на читаемость и usability
- Скруглённые углы (medium radius)
- Мягкие тени — без тяжёлого glassmorphism

---

## Цветовая система

### Тёмная тема (PRIMARY)

| Роль        | Токен               | Hex       |
|-------------|---------------------|-----------|
| Background  | `--color-bg`        | `#0F172A` |
| Surface     | `--color-surface`   | `#1E293B` |
| Primary     | `--color-primary`   | `#818CF8` |
| Secondary   | `--color-secondary` | `#94A3B8` |
| Accent      | `--color-accent`    | `#F59E0B` |
| Success     | `--color-success`   | `#22C55E` |
| Error       | `--color-error`     | `#EF4444` |

### Светлая тема

| Роль        | Токен               | Hex       |
|-------------|---------------------|-----------|
| Background  | `--color-bg`        | `#F8FAFC` |
| Surface     | `--color-surface`   | `#FFFFFF` |
| Primary     | `--color-primary`   | `#818CF8` |
| Secondary   | `--color-secondary` | `#64748B` |
| Accent      | `--color-accent`    | `#F59E0B` |
| Success     | `--color-success`   | `#16A34A` |
| Error       | `--color-error`     | `#DC2626` |

> Primary и Accent — одинаковые в обеих темах.

---

## Типографика

- Шрифт: чистый sans-serif (Inter / Geist)
- Строгая иерархия:

| Уровень   | Размер | Вес   | Использование           |
|-----------|--------|-------|-------------------------|
| Headline  | 24–32px | 700  | Заголовки страниц       |
| Subhead   | 18–20px | 600  | Секции, карточки        |
| Body      | 14–16px | 400  | Основной текст          |
| Label     | 12–13px | 500  | Подписи, теги, метаданные |

---

## Компоненты

### Кнопки

| Вариант   | Описание                              |
|-----------|---------------------------------------|
| Primary   | Заполненный, `--color-primary`        |
| Secondary | Серый фон, нейтральный                |
| Outline   | Прозрачный фон, граница `--color-primary` |
| Ghost     | Без фона и границы, только текст      |

### Инпуты
- Чистые, тонкая граница (`--color-secondary` 40% opacity)
- Focus: граница `--color-primary`
- Без тяжёлых теней

### Карточки
- `border-radius: 12px`
- `box-shadow: 0 1px 4px rgba(0,0,0,0.08)` (light) / `0 1px 4px rgba(0,0,0,0.3)` (dark)
- Фон: `--color-surface`

### Таблицы
- Чёткое разделение строк
- Нет зебры — только hover highlight
- Хорошие отступы (padding 12px 16px на ячейку)

### Навигация
- Left sidebar + top bar
- Sidebar: иконки + текст, активный пункт = `--color-primary` фон с 15% opacity

### Иконки
- Простые line icons (Lucide React — уже в стеке)

---

## Система отступов (8px grid)

```
4px  — xs (внутри компонентов)
8px  — sm
12px — md
16px — base
24px — lg
32px — xl
48px — 2xl
64px — 3xl
```

Все padding/gap/margin — кратны 4px.

---

## UX-принципы

- **Fast scanning** — важно для CRM: данные должны считываться за секунды
- **Clear CTA** — одна главная кнопка на экране
- **No visual noise** — убирать всё что не несёт смысла
- **Consistent spacing** — 8px grid везде

---

## Запрещено

- Glassmorphism overload (backdrop-blur на каждом элементе)
- Неоновые градиенты
- Игривые цвета (пастель, яркий пурпур и т.д.)
- Сложные анимации (только transition 150–200ms ease)
- Тени глубиной > 8px

---

## Реализация в коде

```tsx
// Tailwind config — добавить кастомные цвета
colors: {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  error: 'var(--color-error)',
}

// CSS переменные в globals.css
:root {
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-primary: #818CF8;
  --color-secondary: #64748B;
  --color-accent: #F59E0B;
  --color-success: #16A34A;
  --color-error: #DC2626;
}

[data-theme="dark"] {
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-primary: #818CF8;
  --color-secondary: #94A3B8;
  --color-accent: #F59E0B;
  --color-success: #22C55E;
  --color-error: #EF4444;
}
```

> Переключение темы: `data-theme` на `<html>`. Не использовать `dark:` класс Tailwind отдельно — только через CSS переменные.

---

*Liquid Authority · savdo-builder · v1.0*
