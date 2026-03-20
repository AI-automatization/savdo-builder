# 03_buyer_identity.md — Модель покупателя

## Проблема

Покупатель в Savdo — не типичный "зарегистрированный пользователь". Основной сценарий:
- пришёл по Telegram-ссылке,
- просматривает товары без регистрации,
- оформляет заказ,
- уходит.

При этом нужно:
- хранить историю заказов по номеру телефона,
- связывать chat thread с покупателем,
- ограничивать спам,
- поддерживать repeat customers.

---

## Решение: Lightweight Customer Identity

**Принцип:** минимальная обязательная идентификация + опциональная авторизация.

---

## Типы состояний покупателя

### 1. Guest (неидентифицирован)

- Нет записи в таблице `buyers`
- Корзина привязана к `session_key` (cookie / localStorage)
- Может просматривать товары и добавлять в корзину
- **Не может** оформить заказ без указания телефона и имени

### 2. Identified Guest (идентифицирован по телефону, без аккаунта)

- При checkout покупатель указывает телефон и имя
- Система проверяет: существует ли `buyers` запись с этим телефоном?
  - Если **нет**: создаётся новая запись `buyers` + `users` (role=buyer)
  - Если **да**: используется существующая запись (merge cart → existing buyer)
- Корзина переносится с `session_key` на `buyer_id`
- Buyer может получить OTP для просмотра истории заказов, но **не обязан**

### 3. Authenticated Buyer (авторизован через OTP)

- Buyer прошёл OTP-верификацию
- Имеет активную сессию (`user_sessions`)
- Видит историю всех своих заказов
- Может открывать chat threads
- Может управлять адресами

---

## Cart-to-Buyer Merge Flow

```
[Guest browses]
  session_key=abc123 → cart_id=X (store_id=Y)

[Buyer reaches checkout]
  buyer enters phone=+998901234567, name="Alisher"

  Backend:
    1. Check buyers WHERE users.phone = '+998901234567'

    2a. Phone NOT FOUND → create user(role=buyer) + buyer record
        cart.buyer_id = new_buyer.id
        cart.session_key = null

    2b. Phone FOUND (existing buyer) →
        if existing buyer has active cart for same store:
          merge cart items (sum quantities, keep higher price snapshot)
          mark old cart as MERGED
        else:
          reassign current cart to existing buyer_id
        cart.buyer_id = existing_buyer.id
        cart.session_key = null

    3. Proceed to create order
```

**Merge policy при конфликте:** если один и тот же variant есть в обеих корзинах — берётся сумма quantity. Если суммарное quantity превышает stock — возвращается ошибка с предложением скорректировать.

---

## OTP для покупателя

OTP для buyer — **опциональный** в момент checkout. Обязателен только для:
- просмотра истории заказов
- доступа к chat threads
- управления профилем

При первом checkout без OTP: заказ создаётся, buyer идентифицирован по телефону.

При последующем визите: если buyer хочет видеть заказы — запрашивает OTP.

**`otp_requests.purpose`:**
- `login` — buyer хочет войти в аккаунт
- `checkout` — buyer верифицирует телефон при оформлении заказа (опционально в MVP, флаг `OTP_REQUIRED_FOR_CHECKOUT`)
- `register` — не используется отдельно (register = verify при первом checkout)

---

## Chat и анонимный покупатель

Проблема: buyer хочет написать продавцу до оформления заказа (product inquiry thread).

Решение для MVP:
- Product inquiry thread создаётся только если buyer идентифицирован (прошёл checkout хотя бы один раз ИЛИ ввёл телефон)
- До идентификации: кнопка "Написать в Telegram" как fallback (всегда доступна)
- После идентификации: доступен internal chat

Это предотвращает спам от полностью анонимных пользователей.

---

## Защита от спама

- Rate limit на создание OTP запросов: 3 попытки / 10 минут / телефон
- Rate limit на создание заказов: 5 заказов / час / телефон (через service layer, не только IP)
- Chat thread: один thread per buyer per product (нельзя спамить множеством тредов)

---

## База данных: ключевые поля

Существующая схема из V0.1 уже поддерживает эту модель:

```sql
carts.buyer_id     -- null для guest
carts.session_key  -- заполнен для guest, null после merge

orders.buyer_id    -- null если buyer не захотел регистрироваться
                   -- (исторически это возможно, но в MVP рекомендуем создавать buyer всегда)

users.status       -- active / blocked
buyers.user_id     -- связь с базовой identity
```

**Решение по orders.buyer_id:** в MVP всегда создаём buyer запись при checkout — phone является достаточным идентификатором. `buyer_id` в заказе не должен быть null после V0.1.

---

## Итоговая политика

| Действие | Требование |
|----------|-----------|
| Просмотр storefront | Нет требований |
| Добавить в корзину | Нет (session_key) |
| Оформить заказ | Телефон + имя (обязательно) |
| Просмотр истории заказов | OTP-верификация |
| Chat (product inquiry) | Телефон известен системе (был хотя бы один checkout) |
| Chat (order thread) | Заказ существует для этого buyer |
| Управление адресами | OTP-верификация |
