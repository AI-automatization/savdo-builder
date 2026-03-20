# 08_operations_model.md — Operations Model

Кто что делает в production. Этот документ отвечает на вопросы: кто одобряет, кто блокирует, кто разбирает инциденты.

---

## Роли в production

| Роль | Кто | Доступ |
|------|-----|--------|
| **Superadmin** | Яхйо (+ Абубакир как CTO-доступ) | Полный доступ к admin panel |
| **DevOps / On-call** | Абубакир | SSH, БД, сервисы |
| **Support** | В будущем | Ограниченный admin (читать заказы, блокировать спамеров) |

---

## Операционные сценарии

### 1. Одобрение нового магазина

**Кто:** Superadmin (Яхйо)

**Процесс:**
1. Seller отправил store на review → в admin panel появляется новый кейс в очереди
2. Admin просматривает: название, slug, Telegram-ссылка, товары
3. Проверяет Telegram-контакт на реальность (открывает ссылку)
4. Approve → seller получает уведомление → может публиковать
5. Reject → указывает причину → seller получает уведомление с причиной

**SLA:** 24 часа с момента подачи на review

**Критерии rejection:**
- Фейковый Telegram контакт
- Запрещённые товары (наркотики, оружие, etc.)
- Явно мошеннический контент
- Дублирующийся аккаунт

---

### 2. Блокировка мошенника

**Кто:** Superadmin

**Процесс:**
1. Жалоба от покупателя / ручное обнаружение
2. Admin проверяет заказы seller-а
3. `sellers.is_blocked = true` → магазин скрывается немедленно
4. Seller теряет write access
5. Исторические заказы и данные сохраняются
6. Уведомление seller-у не отправляется (против fraud)

**После блокировки:**
- Все активные заказы этого seller-а получают статус требующий ручного разбора
- Admin может просмотреть историю чатов для доказательной базы

---

### 3. Разбор пропавшего заказа

**Кто:** Superadmin (читает) / DevOps (если нужна БД)

**Сценарий:** покупатель говорит "я сделал заказ, но он исчез"

**Процесс:**
1. Admin ищет заказ по номеру телефона покупателя
2. Смотрит `order_status_history` — полная история переходов
3. Смотрит `audit_logs` — действия admin-ов если были
4. Если заказ есть — информирует покупателя о статусе
5. Если заказ не найден — смотрит `analytics_events` на `order_created` event
6. Если event есть а заказа нет — это инцидент, эскалация в DevOps

---

### 4. Чистка медиа (orphan files)

**Кто:** DevOps (Абубакир) — через cron job или вручную

**Сценарий:** загруженные но неприкреплённые файлы занимают место в R2

**Автоматически:**
- BullMQ maintenance job раз в сутки: проверяет `media_files` без привязки к entity (нет в `product_images`, `stores.logo_media_id`, etc.) старше 24 часов → удаляет из R2 + из таблицы

**Вручную:**
- DevOps может запустить cleanup job через admin CLI или отдельный admin endpoint

---

### 5. Восстановление данных

**Кто:** DevOps (Абубакир)

**Backup policy (минимум для MVP):**
- PostgreSQL: автоматический daily dump через pg_dump или managed service (Railway / Render / Supabase)
- R2: versioning не нужен в MVP (медиа восстановить нельзя, только БД важна)
- Redis: не критично (очереди и кэш — восстанавливаются сами)
- Хранить последние 7 дней бэкапов

**Restore drill:** один раз в месяц тестировать восстановление на staging окружении

---

### 6. Реагирование на downtime

**Кто:** DevOps (Абубакир)

**Уровни инцидентов:**

| Уровень | Что | Время реакции |
|---------|-----|--------------|
| P1 | API полностью недоступен | 30 минут |
| P2 | Отдельные модули недоступны (чат, уведомления) | 2 часа |
| P3 | Деградация производительности | 24 часа |

**Мониторинг:**
- Uptime check: Betterstack / UptimeRobot (простой вариант)
- Error rate: Sentry
- Logs: stdout + structrued logging → можно подключить Logtail / Better Stack later

---

## Что admin должен видеть в admin panel

### Очереди требующие действия

- `Ожидают проверки` — store pending review (с SLA-таймером)
- `Жалобы` — будущее; в MVP нет формы жалоб

### Общие метрики (MVP Plus)

- Новых sellers за 7 дней
- Активных stores
- Заказов за сегодня / неделю
- Последние ошибки (Sentry интеграция)

### Поиск

- По номеру телефона (seller или buyer)
- По order number
- По store slug

---

## Audit log: что обязательно логировать

| Действие | actor_type | action |
|---------|-----------|--------|
| Admin approve store | admin | `store.approved` |
| Admin reject store | admin | `store.rejected` |
| Admin suspend store | admin | `store.suspended` |
| Admin block seller | admin | `seller.blocked` |
| Admin hide product | admin | `product.hidden` |
| Seller price change | seller | `product.price_updated` |
| Order status change | seller/buyer/system | `order.status_changed` |
| Store publish | seller | `store.published` |
| Admin restore seller | admin | `seller.restored` |

Все записи в `audit_logs` — **append-only**, никогда не удаляются и не изменяются.
