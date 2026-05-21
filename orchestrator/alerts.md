# Alerts — что требует Полата прямо сейчас

> Если этот файл пуст — всё под контролем.
> Когда добавляешь пункт — формат: `- [ ] YYYY-MM-DD HH:MM — действие`.
> После закрытия — удалять (история есть в sessions.md).

- [ ] 2026-05-21 18:45 — **TMA build всё ещё падает** на Railway. Settings → Build → Builder = Dockerfile, Path = `apps/tma/Dockerfile`, Root Directory = пусто. После сохранения — Redeploy.
- [ ] 2026-05-21 18:45 — **Sentry DSN не задан** — Observability на ~50% возможностей. Получить DSN на sentry.io → Railway api Variables → SENTRY_DSN → Redeploy.
- [ ] 2026-05-21 18:45 — **Restore-drill не прогонялся** — Data блокер до launch. Нужен `DATABASE_URL` от Railway prod (Postgres сервис → Connect).
- [ ] 2026-05-21 18:45 — **VERIFY-CHECKOUT-CONFIRM-500-001** — пройти корзинный checkout в TMA на проде (оба режима delivery + pickup), отписать результат.
