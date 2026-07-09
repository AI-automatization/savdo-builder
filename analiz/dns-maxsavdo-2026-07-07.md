# DNS-записи для Cloudflare — maxsavdo.uz (Railway, 07.07.2026)

> Сгенерировано Railway при привязке кастомных доменов (DEPLOY-DOMAIN-MAXSAVDO-001).
> Для КАЖДОГО домена нужны ДВЕ записи: CNAME + TXT (верификация).
> Карта утверждена owner-ом 07.07: apex+www → landing · shop → web-buyer ·
> seller → web-seller · api → savdo-api. Admin/TMA остаются на railway.app.

## Записи (вносить в Cloudflare DNS)

| # | Тип | Name | Value | Proxy |
|---|-----|------|-------|-------|
| 1 | CNAME | `@` | `5oy05e7y.up.railway.app` | 🟠 Proxied |
| 2 | TXT | `_railway-verify` | `railway-verify=d10bdb959aa1c0544be20ba5b034a18bcb95ad75f0ec637b1bece9c53446975a` | — |
| 3 | CNAME | `www` | `ggnri8a2.up.railway.app` | 🟠 Proxied |
| 4 | TXT | `_railway-verify.www` | `railway-verify=cfffeedd3a8d70f95354c3a0ffab73b09f305fd8d372d422c65a540d81d93be8` | — |
| 5 | CNAME | `shop` | `2hba0kzp.up.railway.app` | 🟠 Proxied |
| 6 | TXT | `_railway-verify.shop` | `railway-verify=4f4f0cce677f45819794ddae86683716f5e93b23bfc8d48145f365a90fa8730b` | — |
| 7 | CNAME | `seller` | `imgm5990.up.railway.app` | 🟠 Proxied |
| 8 | TXT | `_railway-verify.seller` | `railway-verify=6b5fdfe214382a45d647dc99dbae3b004c25cc125c6980d388a28c11488369ad` | — |
| 9 | CNAME | `api` | `ixm6sqwn.up.railway.app` | 🟠 Proxied |
| 10 | TXT | `_railway-verify.api` | `railway-verify=6857a175507b34f62641301152e179c53808a204e67b26c4b01a0f8c2e2a9fcf` | — |

Соответствие сервисам (порт выбран в Railway):
- `@` / `www` → **landing** (порт 8080)
- `shop` → **savdo-builder-by** / web-buyer (порт 8080)
- `seller` → **savdo-builder-sl** / web-seller (порт 8080)
- `api` → **savdo-api** (порт 3000)

## ⚠️ Обязательные настройки Cloudflare

1. **SSL/TLS → Overview → Full (strict)**. НЕ Flexible — иначе redirect-петля
   (Railway отдаёт HTTPS + у web-апов HSTS).
2. CNAME на apex (`@`) — Cloudflare сам делает flattening, это ок.
3. **NS-делегирование не активно** (проверено 07.07 ~14:00: SERVFAIL даже на NS-запрос
   через 1.1.1.1). Проверить у регистратора .uz, что nameservers указывают на Cloudflare;
   делегирование .uz может идти часы.

## После того как DNS заработает (зона Полата)

1. В Railway у каждого домена статус сменится с «Waiting for DNS update» на активный.
2. Обновить env vars (НЕ раньше, чем DNS резолвится, иначе прод сломается):
   - web-buyer: `NEXT_PUBLIC_BUYER_URL=https://shop.maxsavdo.uz`, `NEXT_PUBLIC_API_URL=https://api.maxsavdo.uz`
   - web-seller: `NEXT_PUBLIC_API_URL=https://api.maxsavdo.uz` (+ buyer-url переменная, если есть)
   - landing: env по необходимости
3. ⚠️ Код-правки под новую карту (apex=landing, магазины на shop.*): парсер ссылок
   web-buyer (`extractSlug`), `buyerStoreUrl` в web-seller, SEO canonical/sitemap —
   зона Азима, координация через tasks.md.
4. Проверки: curl всех 5 доменов, `api.maxsavdo.uz/api/v1/health`, CORS с новых origin
   (wildcard `*.maxsavdo.uz` уже в проде — коммит `e18f94e`), TMA/бот живы.
5. UptimeRobot на новые домены + Search Console (связка с SEO-AUDIT-001).
