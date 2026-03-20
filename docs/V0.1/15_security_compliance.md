# 15_security_compliance.md

## 1. Security Overview

Security в этом проекте — это не отдельный слой “для галочки”, а фундамент:

- доверия пользователей
- стабильности системы
- защиты данных
- защиты бизнеса
- защиты от abuse и мошенничества

На V0.1 цель не сделать банковскую систему, но:
система должна быть **достаточно защищённой для реального продакшена**.

---

## 2. Security Goals

- защитить пользовательские данные
- предотвратить несанкционированный доступ
- защитить critical flows (auth, checkout, chat)
- минимизировать abuse
- обеспечить контроль через admin
- быть готовыми к масштабированию безопасности

---

## 3. Threat Model (упрощённо)

Основные угрозы:

- brute force (OTP)
- account takeover
- доступ к чужим заказам/чатам
- массовый спам через chat
- загрузка вредоносных файлов
- утечка media (особенно seller docs)
- API abuse
- подмена данных на frontend
- утечка токенов

---

## 4. Core Security Principles

## 4.1 Backend is Source of Truth
Frontend никогда не является источником истины.

## 4.2 Validate Everything
Любой input должен валидироваться:
- body
- query
- params
- headers

## 4.3 Least Privilege
Пользователь должен иметь доступ только к своему.

## 4.4 Fail Secure
Если что-то не ясно → deny.

---

## 5. Authentication Security

## 5.1 OTP Protection

- rate limit по номеру
- rate limit по IP
- ограничение попыток
- короткий TTL
- хранение в hash

## 5.2 Token Security

- access token короткий
- refresh token хэшируется
- rotation refresh token
- logout инвалидирует

## 5.3 Session Security

- multiple sessions ok
- возможность revoke
- tracking device optional

---

## 6. Authorization

## 6.1 Must Check

- role
- ownership
- status (blocked/suspended)
- business rules

## 6.2 Examples

❌ Нельзя:
seller → получить чужой заказ

❌ Нельзя:
buyer → открыть чужой чат

✔ Нужно:
всегда проверять ownership

---

## 7. API Security

## 7.1 Validation

- DTO validation (class-validator)
- strict schema
- whitelist enabled

## 7.2 Rate Limiting

Особенно для:
- auth endpoints
- OTP
- public endpoints

## 7.3 Headers

- CORS настроен
- secure headers (helmet)

---

## 8. Input Sanitization

## 8.1 Chat Messages

- очистка текста
- защита от XSS

## 8.2 Forms

- trimming
- validation
- запрет dangerous input

---

## 9. File Upload Security

## 9.1 Validate

- mime type
- file size
- file extension

## 9.2 Forbidden

- executable files
- scripts
- unknown binary

## 9.3 Storage

- разделение public/private
- seller docs не публичные

---

## 10. Media Security

## 10.1 Public Media

- только безопасные типы
- no sensitive data

## 10.2 Private Media

- доступ через backend или signed URL
- ограниченное время жизни

---

## 11. Chat Security

## 11.1 Must Validate

- user в thread
- thread принадлежит user

## 11.2 Anti-Abuse

- rate limit сообщений
- basic spam control

---

## 12. Order Security

## 12.1 Critical Rules

- нельзя изменить order через frontend
- все расчёты на backend
- snapshot immutable

## 12.2 Actions

- buyer cancel только до confirm
- seller confirm/cancel только свой order

---

## 13. Admin Security

## 13.1 Stronger Rules

- отдельный auth
- protected routes
- audit log

## 13.2 Dangerous Actions

- block seller
- hide product
- change order

→ всегда логируются

---

## 14. Data Protection

## 14.1 Sensitive Data

- phone
- address
- seller documents

## 14.2 Rules

- не логировать в raw виде
- не отдавать лишнее клиенту
- минимизация данных

---

## 15. Logging Security

## 15.1 Do Not Log

- OTP codes
- tokens
- passwords (если появятся)
- sensitive documents

## 15.2 Log

- ошибки
- подозрительные действия
- admin действия

---

## 16. Rate Limiting

## 16.1 Must Protect

- OTP
- login
- chat send
- public APIs

---

## 17. Abuse Prevention

## 17.1 V0.1 Simple Rules

- rate limit
- basic validation
- admin moderation

## 17.2 Later

- spam detection
- fraud detection

---

## 18. Secrets Management

## 18.1 Rules

- .env
- не хранить в коде
- разные ключи для env

---

## 19. Transport Security

## 19.1 HTTPS Only

- все запросы через HTTPS
- no HTTP in production

---

## 20. Dependency Security

## 20.1 Must

- обновлять пакеты
- избегать deprecated libs

---

## 21. Error Handling

## 21.1 Do Not Leak

- stack traces
- internal errors
- DB details

## 21.2 Return

- безопасные ошибки

---

## 22. Backup Security

- backups защищены
- доступ ограничен

---

## 23. Future Compliance

На V0.1 не требуется full compliance (GDPR etc), но:

- архитектура должна позволять
- user data removable
- audit logs есть

---

## 24. Testing Security

Проверить:

- нельзя получить чужие данные
- нельзя обойти auth
- нельзя загрузить опасный файл
- нельзя спамить без limit

---

## 25. Incident Response

Если проблема:

- логировать
- блокировать доступ
- уведомлять admin

---

## 26. Final Security Rules

- backend всегда проверяет всё
- auth + ownership обязательны
- OTP защищён
- файлы безопасны
- chat не дырка
- admin действия логируются
- данные защищены

Главная цель security слоя:
сделать систему безопасной настолько, чтобы пользователи доверяли ей свои заказы, данные и взаимодействие, без усложнения разработки и скорости запуска.