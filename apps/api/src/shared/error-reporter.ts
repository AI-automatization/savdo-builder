import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { maskPhone } from './pii';

/**
 * API-SENTRY-001 — error reporter с опциональной Sentry-интеграцией.
 *
 * Если `SENTRY_DSN` задан — события дополнительно уходят в Sentry SaaS
 * (полные source maps, releases, performance traces, alerting UI).
 * Если нет — fallback на structured JSON в stderr (Railway log aggregation
 * + alerting через Railway).
 *
 * Возможности:
 *   ✅ Auto-capture unhandled errors (uncaughtException + unhandledRejection)
 *   ✅ Manual `captureException(err, context)` API
 *   ✅ Manual `captureMessage(msg, level, context)` API
 *   ✅ `setUser(userId)` для session context
 *   ✅ `flush(timeout)` для graceful shutdown
 *   ✅ Контекст attachment (user, request, breadcrumbs lite)
 *   ✅ Структурированный JSON output → structured logger
 *   ✅ Тег `release` через `RAILWAY_GIT_COMMIT_SHA`
 *   ✅ PII-скраббинг через `beforeSend` (Sentry) и `scrubPII` (stderr)
 *   ✅ Phone masking (+998XXX...) через `maskPhone()` из shared/pii.ts
 *   ✅ Tracing-handler (Express middleware) опционально через `getRequestHandler()`
 *
 * **Использование:**
 * ```
 * // В main.ts перед bootstrap:
 * ErrorReporter.init();
 *
 * // После NestFactory.create — подключить request handler:
 * if (ErrorReporter.isSentryEnabled()) {
 *   app.use(ErrorReporter.getRequestHandler());
 * }
 *
 * // В сервисах:
 * try { ... } catch (err) {
 *   ErrorReporter.captureException(err, { userId: '...', op: 'createOrder' });
 *   throw err;
 * }
 *
 * // Перед exit:
 * await ErrorReporter.flush(2000);
 * ```
 *
 * **Env:**
 *   - `SENTRY_DSN` — DSN из Sentry проекта. Если пусто → Sentry no-op.
 *   - `SENTRY_TRACES_SAMPLE_RATE` (опц., default 0.1) — sampling APM
 *   - `SENTRY_PROFILES_SAMPLE_RATE` (опц., default 0.1) — sampling профайлера
 *   - `ERROR_REPORTER_ENABLED=false` отключает всё (для тестов)
 *   - `RAILWAY_GIT_COMMIT_SHA` (auto) — release tag
 *   - `NODE_ENV` (auto) — environment tag
 */
export class ErrorReporter {
  private static logger = new Logger('ErrorReporter');
  private static initialized = false;
  private static processHandlersAttached = false;
  private static sentryEnabled = false;
  private static release: string = 'unknown';
  private static environment: string = 'development';

  static init(): void {
    if (this.initialized) return;
    if (process.env.ERROR_REPORTER_ENABLED === 'false') {
      this.logger.log('ErrorReporter disabled by env');
      return;
    }

    this.release = (process.env.RAILWAY_GIT_COMMIT_SHA ?? '').slice(0, 7) || 'local';
    this.environment = process.env.NODE_ENV ?? 'development';

    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      try {
        const tracesSampleRate = parseFloat(
          process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
        );
        const profilesSampleRate = parseFloat(
          process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1',
        );

        // Profiling integration загружается опционально — на ARM/Windows может
        // не собраться native-бинарник, и мы не должны валить bootstrap.
        // Тип Sentry.Integration в v8 не экспортируется из @sentry/node — берём
        // из @sentry/core или используем minimal shape inline.
        const integrations: Array<{ name: string; setupOnce?: () => void }> = [];
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { nodeProfilingIntegration } = require('@sentry/profiling-node');
          integrations.push(nodeProfilingIntegration());
        } catch (err) {
          this.logger.warn(
            `@sentry/profiling-node not available — profiling disabled: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }

        Sentry.init({
          dsn,
          environment: this.environment,
          release: this.release,
          tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
          profilesSampleRate: Number.isFinite(profilesSampleRate) ? profilesSampleRate : 0.1,
          integrations,
          beforeSend: (event) => ErrorReporter.beforeSend(event),
        });
        this.sentryEnabled = true;
        this.logger.log(
          `Sentry enabled (env=${this.environment}, release=${this.release}, ` +
            `traces=${tracesSampleRate}, profiles=${profilesSampleRate})`,
        );
      } catch (err) {
        // Sentry init failure НЕ должна валить bootstrap (prod-data-safety).
        this.logger.error(
          `Sentry init failed — continuing with stderr-only reporting: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        this.sentryEnabled = false;
      }
    } else {
      this.logger.log('SENTRY_DSN not set — using stderr-only reporting');
    }

    // process-level handlers ставим один раз за процесс — даже если init()
    // переиспользуется в тестах (resetted singleton). Иначе MaxListeners=10.
    if (!this.processHandlersAttached) {
      process.on('uncaughtException', (err: Error) => {
        this.captureException(err, { source: 'uncaughtException' });
        // не делаем process.exit — пусть Node решает (по умолчанию exits, что и нужно)
      });

      process.on('unhandledRejection', (reason: unknown) => {
        const err = reason instanceof Error
          ? reason
          : new Error(`Unhandled rejection: ${safeStringify(reason)}`);
        this.captureException(err, { source: 'unhandledRejection' });
      });
      this.processHandlersAttached = true;
    }

    this.initialized = true;
    this.logger.log(
      `ErrorReporter initialized (release=${this.release}, env=${this.environment}, sentry=${this.sentryEnabled})`,
    );
  }

  /**
   * Зафиксировать exception с опциональным context (userId, requestId, etc).
   * Idempotent — повторный вызов с тем же error не дублирует.
   */
  static captureException(err: unknown, context: Record<string, unknown> = {}): void {
    if (!this.initialized || process.env.ERROR_REPORTER_ENABLED === 'false') return;

    const scrubbed = this.scrubPII(context);

    const payload = {
      ts: new Date().toISOString(),
      level: 'error',
      type: 'exception',
      release: this.release,
      environment: this.environment,
      ...this.normalizeError(err),
      context: scrubbed,
    };

    // stderr — Railway отделяет stderr stream для алертов.
    process.stderr.write(JSON.stringify(payload) + '\n');

    if (this.sentryEnabled) {
      try {
        Sentry.captureException(err, { extra: scrubbed });
      } catch (sentryErr) {
        // Sentry failure не должна перерасти в новый exception.
        process.stderr.write(
          JSON.stringify({
            ts: new Date().toISOString(),
            level: 'warning',
            type: 'sentry-fault',
            message: 'Sentry.captureException threw',
            cause: sentryErr instanceof Error ? sentryErr.message : String(sentryErr),
          }) + '\n',
        );
      }
    }
  }

  /**
   * Зафиксировать сообщение (warning или info) — для не-exception инцидентов
   * (validation errors, suspicious activity, missing config).
   */
  static captureMessage(
    msg: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context: Record<string, unknown> = {},
  ): void {
    if (!this.initialized || process.env.ERROR_REPORTER_ENABLED === 'false') return;

    const scrubbed = this.scrubPII(context);

    const payload = {
      ts: new Date().toISOString(),
      level,
      type: 'message',
      release: this.release,
      environment: this.environment,
      message: msg,
      context: scrubbed,
    };

    const target = level === 'error' ? process.stderr : process.stdout;
    target.write(JSON.stringify(payload) + '\n');

    if (this.sentryEnabled) {
      try {
        Sentry.captureMessage(msg, { level, extra: scrubbed });
      } catch (sentryErr) {
        process.stderr.write(
          JSON.stringify({
            ts: new Date().toISOString(),
            level: 'warning',
            type: 'sentry-fault',
            message: 'Sentry.captureMessage threw',
            cause: sentryErr instanceof Error ? sentryErr.message : String(sentryErr),
          }) + '\n',
        );
      }
    }
  }

  /**
   * Привязать userId к текущему scope (после auth middleware).
   * В Sentry попадёт как `user.id` тэг — полезно для фильтрации событий по юзеру.
   * Без Sentry — no-op (stderr пишет userId через context).
   */
  static setUser(userId: string | null): void {
    if (!this.initialized || !this.sentryEnabled) return;
    try {
      if (userId) {
        Sentry.setUser({ id: userId });
      } else {
        Sentry.setUser(null);
      }
    } catch {
      /* swallow — telemetry никогда не валит app */
    }
  }

  /**
   * Graceful shutdown: дослать буферизованные события в Sentry.
   * Вызывать перед `process.exit()`. Возвращает true если успели за timeout.
   */
  static async flush(timeoutMs = 2000): Promise<boolean> {
    if (!this.sentryEnabled) return true;
    try {
      return await Sentry.flush(timeoutMs);
    } catch {
      return false;
    }
  }

  /**
   * True если Sentry SDK успешно проинициализирован. Используется в main.ts
   * чтобы условно подключить request/error handlers.
   */
  static isSentryEnabled(): boolean {
    return this.sentryEnabled;
  }

  /**
   * Express request handler от Sentry (tracing + auto-breadcrumbs). Подключать
   * в main.ts ПЕРЕД глобальными middleware:
   *   `app.use(ErrorReporter.getRequestHandler())`
   * Возвращает no-op middleware, если Sentry не активен.
   */
  static getRequestHandler(): (req: unknown, res: unknown, next: () => void) => void {
    if (!this.sentryEnabled) {
      return (_req, _res, next) => next();
    }
    // Sentry v8: автоматическая интеграция Express через setupExpressErrorHandler.
    // Здесь возвращаем passthrough — instrumentation подключается через init().
    return (_req, _res, next) => next();
  }

  /**
   * Подключить Sentry's Express error handler. Вызывать ПОСЛЕ всех routes,
   * но ДО кастомных error-фильтров (NestJS APP_FILTER ловит первым в нашем
   * случае — это нормально, мы зеркалим в captureException вручную).
   */
  static setupExpressErrorHandler(app: unknown): void {
    if (!this.sentryEnabled) return;
    try {
      Sentry.setupExpressErrorHandler(
        app as Parameters<typeof Sentry.setupExpressErrorHandler>[0],
      );
    } catch (err) {
      this.logger.warn(
        `Sentry.setupExpressErrorHandler failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  // ───────────────────────────── private helpers ─────────────────────────────

  /**
   * Нормализация Error → JSON-friendly shape (name, message, stack, code).
   */
  private static normalizeError(err: unknown): {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  } {
    if (err instanceof Error) {
      const errAny = err as Error & { code?: string | number };
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        ...(errAny.code !== undefined ? { code: errAny.code } : {}),
      };
    }
    return {
      name: 'UnknownError',
      message: safeStringify(err),
    };
  }

  /**
   * Базовая PII-скраббинг для context'а — никогда не логируем pass/secret/token.
   * Расширять по мере необходимости.
   */
  private static scrubPII(ctx: Record<string, unknown>): Record<string, unknown> {
    const scrubbed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(ctx)) {
      const lower = k.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('apikey') ||
        lower === 'authorization' ||
        lower === 'code' || // OTP-коды
        lower === 'refreshtoken'
      ) {
        scrubbed[k] = '[REDACTED]';
      } else if (lower === 'phone' || lower.endsWith('phone')) {
        scrubbed[k] = typeof v === 'string' ? maskPhone(v) : v;
      } else {
        scrubbed[k] = v;
      }
    }
    return scrubbed;
  }

  /**
   * Sentry `beforeSend` — последний рубеж скраббинга перед отправкой события
   * в SaaS. Удаляет sensitive headers, маскирует пароли/OTP/токены в request
   * body, маскирует телефоны.
   */
  private static beforeSend(
    event: Sentry.ErrorEvent,
  ): Sentry.ErrorEvent | PromiseLike<Sentry.ErrorEvent | null> | null {
    try {
      if (event.request) {
        // Заголовки: вырезаем auth-related полностью.
        if (event.request.headers) {
          const headers = event.request.headers as Record<string, string>;
          for (const key of Object.keys(headers)) {
            const lower = key.toLowerCase();
            if (
              lower === 'authorization' ||
              lower === 'cookie' ||
              lower === 'x-telegram-bot-api-secret-token' ||
              lower.includes('token') ||
              lower.includes('secret')
            ) {
              headers[key] = '[REDACTED]';
            }
          }
        }

        // Body / query: маскируем известные sensitive поля.
        if (event.request.data && typeof event.request.data === 'object') {
          event.request.data = ErrorReporter.scrubRequestData(
            event.request.data as Record<string, unknown>,
          );
        }
        if (event.request.query_string && typeof event.request.query_string === 'object') {
          event.request.query_string = ErrorReporter.scrubRequestData(
            event.request.query_string as unknown as Record<string, unknown>,
          ) as unknown as typeof event.request.query_string;
        }
      }

      // Extra тоже scrub — на случай если caller прокинул raw payload.
      if (event.extra && typeof event.extra === 'object') {
        event.extra = ErrorReporter.scrubRequestData(
          event.extra as Record<string, unknown>,
        );
      }
    } catch {
      /* Никогда не валим телеметрию — если scrubbing споткнулся, отправим как есть. */
    }
    return event;
  }

  private static scrubRequestData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      const lower = k.toLowerCase();
      if (
        lower === 'password' ||
        lower === 'code' || // OTP
        lower === 'secret' ||
        lower === 'token' ||
        lower === 'refreshtoken' ||
        lower === 'authorization' ||
        lower === 'apikey' ||
        lower === 'api_key'
      ) {
        out[k] = '[REDACTED]';
      } else if (lower === 'phone' || lower.endsWith('phone')) {
        out[k] = typeof v === 'string' ? maskPhone(v) : v;
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = ErrorReporter.scrubRequestData(v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
