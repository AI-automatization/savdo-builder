# claude-plugins-official — рекомендации под Полата (analysis 2026-06-03)

Анализ всех 37 internal + 16 external плагинов. Цель: выбрать кандидаты на постоянку для savdo-builder и решить вопрос с браузером.

---

## A. Проблема «Chrome на D-диске, куки не достаются»

**Корень:** ты, видимо, пробуешь подцепиться к Chrome-профилю напрямую (читать `Cookies` SQLite, ставить browser-extension с cookie-access, etc.). В Win10/11 это ломается из-за:
1. Файл `Cookies` залочен запущенным Chrome (single-writer SQLite).
2. С Chrome 127+ куки шифруются `app_bound_encryption` (DPAPI + per-app key), читать снаружи процесса всё сложнее.
3. Если расширение в режиме `developer-mode` и профиль на другом диске — Manifest V3 + Enhanced Safe Browsing может блокировать.

**Решение из плагинов:** `external_plugins/playwright/` → запускает `@playwright/mcp@latest` (Microsoft official). Внутри Playwright **не нужно лезть в Cookies-файл вообще** — есть два чистых пути:

### Путь 1 (рекомендую): CDP-подключение к уже запущенному Chrome

```powershell
# 1. Закрой ВСЕ окна Chrome (важно — иначе debug-port не откроется)
# 2. Запусти Chrome с debug-портом и со ссылкой на свой профиль:
& "D:\Path\To\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="D:\Path\To\Your\Chrome\User Data"

# 3. Подключи Playwright MCP через CDP — он унаследует ВСЕ куки/сессии этого профиля:
#    в .mcp.json:
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--cdp-endpoint=http://localhost:9222"]
  }
}
```

Куки/localStorage/sessions — всё из живого Chrome. Никакого чтения файла, никакого DPAPI.

### Путь 2: Playwright запускает свой Chromium с твоим user-data-dir

```json
{
  "playwright": {
    "command": "npx",
    "args": [
      "@playwright/mcp@latest",
      "--browser=chrome",
      "--user-data-dir=D:\\Path\\To\\Your\\Chrome\\User Data\\Default"
    ]
  }
}
```

Этот вариант блокирует другие окна Chrome (single-instance lock). Для постоянной работы — путь 1 удобнее.

**Браузерное расширение для Claude (не из этого репо, но релевантно):** официальное называется «Claude for Chrome» (research preview, web claude.ai/extension). Оно НЕ читает куки из других сайтов — оно даёт Claude инструменты для взаимодействия с активной вкладкой через standard DOM API. Если ты хотел именно cookie-access — это не оно, и в принципе никакой расширение это не сделает легально из-за Same-Origin / DPAPI.

---

## B. Топ плагинов под savdo-builder

### B.1 Кибербезопасность

| Плагин | Что даёт | Почему ставить |
|---|---|---|
| **`security-guidance`** | 3 слоя: (1) regex-паттерны на Edit/Write (yaml.load, hardcoded secrets, innerHTML, ~25 правил); (2) LLM-review диффа после каждого хода Claude (Opus 4.7); (3) agentic-review на `git commit` с трассировкой через файлы (IDOR, auth bypass, SSRF) | savdo-builder в проде, API + платежи Click/Payme + Storage. Pattern-слой ловит мелочь сразу, commit-слой — кросс-файловые баги. По цене Opus-вызовов на дифф — терпимо. |
| **`pr-review-toolkit`** | 6 специализированных агентов: `comment-analyzer`, `test-coverage-reviewer`, `error-handling-reviewer`, `type-design-reviewer`, `code-quality`, `code-simplifier` | Запускать пакетом перед merge в `api`/`admin` ветки. Когда параллельная сессия в savdo-builder делает большой рефакторинг — пускать через этот toolkit. |

### B.2 Разработка / Backend / Frontend

| Плагин | Что даёт | Почему ставить |
|---|---|---|
| **`context7` (Upstash)** | MCP-сервер: подтягивает АКТУАЛЬНУЮ доку из реальных репозиториев. Pin к версии. | Чтобы Claude не галлюцинировал API NestJS 11/Prisma 6/grammy 1.21/TanStack Query v5. Особенно ценно с учётом feedback_research_before_assume и stack_versions памяти. |
| **`serena` (Oraios)** | Semantic LSP-навигация по коду (find symbol, references, hover types) | Для крупного монорепо (savdo-builder/apps/{api,admin,tma,...}) экономит токены: вместо `Grep + Read` → точечный symbol-lookup. |
| **`feature-dev`** | 7-фазный workflow: explore → ask → design → review → implement → review → finalize | Для крупных фич (биллинг-машина, миграция дизайна). Заставляет НЕ прыгать сразу в код. |
| **`claude-code-setup`** | Анализирует кодбазу и предлагает hooks/skills/MCP/subagents | Прогнать один раз поверх savdo-builder/, потом раз в месяц — увидим что Anthropic советует подключить. |
| **`frontend-design`** | Дизайн-токены, accessibility, layout-проверки | Поможет при миграции TMA на design-v2 (Champagne Gold / Rich Black / Inter). |

### B.3 DevOps / Workflow

| Плагин | Что даёт | Почему ставить |
|---|---|---|
| **`commit-commands`** | `/commit`, `/push`, `/pr` — авто-генерация месседжей в стиле репо | Экономия 3-4 минут на каждый коммит. Параллельная сессия будет коммитить чаще. |
| **`code-review`** | `/code-review` — 4 параллельных агента (CLAUDE.md compliance + correctness + tests + simplification) с confidence-scoring | После любой непростой фичи — прогнать перед merge. |
| **`code-simplifier`** | Только quality-fixes (reuse / efficiency), без bug-hunting | Лёгкий «уборщик» после feature-dev. |
| **`code-modernization`** | Workflow `assess → map → extract-rules → reimagine` для legacy | Если будем рефакторить старые модули savdo-builder. Не срочно. |
| **`hookify`** | Создавать hooks через markdown + YAML вместо ручного `hooks.json` | Удобно для команды — не каждый знает hooks-формат. |
| **`mcp-tunnels`** | Прокинуть MCP-сервер из приватной сети через outbound-only канал (Cloudflare-backed) | Если когда-то понадобится дёргать что-то в локалке savdo-builder из cloud Claude. |
| **`playwright`** | Microsoft MCP — DOM, скрины, формы, E2E | Авто-тесты TMA + checkout-flow. Решает проблему с куками (см. секцию A). |
| **`pyright-lsp`/`typescript-lsp`** | LSP-обёртки — type-errors не пропустить | `typescript-lsp` обязателен (NestJS+React+TMA). |
| **`session-report`** | Авто-отчёт по сессии | Для отчётности orchestrator-протокола (см. feedback_orchestrator_protocol). |

### B.4 Workflow-эксперименты (поставить, попробовать, решить)

| Плагин | Идея |
|---|---|
| `ralph-loop` | While-true прогон Claude, пока задача не решена. Можно попробовать на упёртых багах. |
| `skill-creator` | Если будем выносить повторяющиеся паттерны (наша `verify` процедура для миграций) в custom skills. |
| `agent-sdk-dev` | Понадобится если будем писать кастомные SDK-приложения вокруг Claude (типа того же tg-agent, только официально). |
| `mcp-server-dev` | Аналогично — если будем писать свой MCP под савдо (например, payment-status). |
| `github` (official) | Управление issues/PR из CLI Claude. Если миграция на GitHub-flow. |
| `linear` | Если поедем на Linear. Сейчас не в стэке. |

### B.5 НЕ ставить

| Плагин | Почему |
|---|---|
| `kotlin-lsp`, `swift-lsp`, `csharp-lsp`, `gopls-lsp`, `clangd-lsp`, `php-lsp`, `lua-lsp`, `ruby-lsp`, `jdtls-lsp`, `rust-analyzer-lsp` | Языки не в стэке savdo-builder. |
| `firebase` | Используем Supabase Storage + Railway Postgres. |
| `terraform` | Инфра на Railway/Supabase, IaC не нужен. |
| `laravel-boost` | PHP не в стэке. |
| `discord`, `imessage` | Канал Plata = Telegram + наш tg-agent уже работает. |
| `fakechat` | Тест-стенд каналов — нам не нужен. |
| `asana`, `gitlab` | Не в стэке. |
| `greptile` | Платный SaaS, у нас уже есть code-review плагин. |
| `math-olympiad`, `playground`, `learning-output-style`, `explanatory-output-style`, `cwc-makers` | Не релевантно проду. |

---

## C. Что предлагаю сделать (порядок)

1. **MUST:** `context7`, `typescript-lsp`, `commit-commands`, `code-review`, `security-guidance` — это пять, которые окупятся в первую неделю.
2. **TRY:** `playwright` (через CDP-подключение к D:\\Chrome, см. секцию A), `feature-dev`, `pr-review-toolkit`.
3. **WATCH:** `serena` (если не справится с монорепо — снять), `hookify`, `session-report`, `mcp-tunnels`.
4. **DEFER:** остальные — по факту запроса.

---

## D. Для соседней Claude-сессии в savdo-builder

Я не могу тебе писать напрямую — каждая сессия изолирована. Если будешь работать над savdo-builder, прочитай этот файл и:
- Реши с Полатом порядок установки (предложение в секции C).
- Перед установкой `security-guidance` — учти что pattern-warnings будут срабатывать на каждый Edit/Write, проверь что не повышает latency недопустимо.
- При установке `context7` — pin версии в `.mcp.json` под наш стэк (см. memory `reference_stacks_versions.md`).
- `playwright` через CDP — единственный путь обойти кукинг-блок D-диска, см. секцию A. Запускать Chrome с `--remote-debugging-port=9222` ДО старта `claude --channels` (или с MCP-сервером).

---

_Author: tg-agent сессия Claude, 2026-06-03._
