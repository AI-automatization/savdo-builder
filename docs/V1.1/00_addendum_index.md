# V1.1 Architecture Addendum — Index

Этот документ является дополнением к V0.1 и не дублирует его содержание.
Цель: формализовать то, что в V0.1 было описано имплицитно или не описано вовсе.

**Принцип чтения:** читать V0.1 как техническую базу, V1.1 как операционную модель продукта.

---

## Файлы

| Файл | Содержание |
|------|-----------|
| [01_domain_invariants.md](01_domain_invariants.md) | Инварианты системы — правила, которые нельзя нарушать ни при каком условии |
| [02_state_machines.md](02_state_machines.md) | Store, Seller, Order — формальные state machines |
| [03_buyer_identity.md](03_buyer_identity.md) | Модель покупателя: анонимный, идентифицированный, merge flow |
| [04_mvp_scope_decisions.md](04_mvp_scope_decisions.md) | Что входит в MVP, что отложено, что отклонено — с обоснованием |
| [05_error_taxonomy.md](05_error_taxonomy.md) | Коды ошибок, категории, структура ответа |
| [06_feature_flags.md](06_feature_flags.md) | Feature flags и их значения по умолчанию |
| [07_seller_onboarding_funnel.md](07_seller_onboarding_funnel.md) | Путь активации продавца как конверсионная воронка |
| [08_operations_model.md](08_operations_model.md) | Кто что делает в production: роли, сценарии, плейбуки |

## ADR (Architecture Decision Records)

| ADR | Решение |
|-----|---------|
| [ADR-001](../adr/ADR-001_modular_monolith.md) | Modular Monolith вместо микросервисов |
| [ADR-002](../adr/ADR-002_one_store_per_seller.md) | Один магазин на продавца в MVP |
| [ADR-003](../adr/ADR-003_no_payments_mvp.md) | Онлайн-платежи откладываются |
| [ADR-004](../adr/ADR-004_chat_scope.md) | Ограниченный scope чата в MVP |
| [ADR-005](../adr/ADR-005_storage_r2.md) | Cloudflare R2 для хранения медиа |
| [ADR-006](../adr/ADR-006_inventory_policy.md) | Политика списания stock при заказе |

---

## Статус

Версия: V1.1
Дата: 2026-03-21
Основание: архитектурный аудит `savdo_builder_architecture_review.md`
