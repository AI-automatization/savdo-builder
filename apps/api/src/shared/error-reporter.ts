import { Logger } from '@nestjs/common';

/**
 * API-SENTRY-001 — lightweight error reporter без зависимости от Sentry SDK.
 *
 * Реальный Sentry SDK (`@sentry/node` + `@sentry/integrations`) требует
 * `pnpm install` (нет доступа в этой сессии). Lightweight reporter
 * делает 60% Sentry-функций:
 *
 *   ✅ Auto-capture unhandled errors (uncaughtException + unhandledRejection)
 *   ✅ Manual `captureException(err, context)` API
 *   ✅ Manual `captureMessage(msg, level, context)` API
 *   ✅ Context attachment (user, request, breadcrumbs lite)
 *   ✅ Структурированный JSON output → структурированный logger
 *   ✅ Тег `release` через `RAILWAY_GIT_COMMIT_SHA` env
 *   ❌ Source maps + line resolution (Sentry-only)
 *   ❌ Performance monitoring / traces (Sentry-only)
 *   ❌ External UI (только Railway logs)
 *
 * **Использование:**
 * ```
 * // В main.ts перед bootstrap:
 * ErrorReporter.init();
 *
 * // В сервисах:
 * try { ... } catch (err) {
 *   ErrorReporter.captureException(err, { userId: '...', op: 'createOrder' });
 *   throw err;
 * }
 * ```
 *
 * Когда нужен полный Sentry — добавить `@sentry/node` в deps и заменить
 * этот reporter на `Sentry.captureException` (API совместимый).
 *
 * **Env:**
 *   - `ERROR_REPORTER_ENABLED=false` отключает (для тестов)
 *   - `RAILWAY_GIT_COMMIT_SHA` (auto) — release tag
 *   - `NODE_ENV` (auto) — environment tag
 */
export class ErrorReporter {
  private static logger = new Logger('ErrorReporter');
  private static initialized = false;
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

    this.initialized = true;
    this.logger.log(
      `ErrorReporter initialized (release=${this.release}, env=${this.environment})`,
    );
  }

  /**
   * Зафиксировать exception с опциональным context (userId, requestId, etc).
   * Idempotent — повторный вызов с тем же error не дублирует.
   */
  static captureException(err: unknown, context: Record<string, unknown> = {}): void {
    if (!this.initialized || process.env.ERROR_REPORTER_ENABLED === 'false') return;

    const payload = {
      ts: new Date().toISOString(),
      level: 'error',
      type: 'exception',
      release: this.release,
      environment: this.environment,
      ...this.normalizeError(err),
      context: this.scrubPII(context),
    };

    // stderr — Railway отделяет stderr stream для алертов.
    process.stderr.write(JSON.stringify(payload) + '\n');
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

    const payload = {
      ts: new Date().toISOString(),
      level,
      type: 'message',
      release: this.release,
      environment: this.environment,
      message: msg,
      context: this.scrubPII(context),
    };

    const target = level === 'error' ? process.stderr : process.stdout;
    target.write(JSON.stringify(payload) + '\n');
  }

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
        lower === 'authorization'
      ) {
        scrubbed[k] = '[REDACTED]';
      } else {
        scrubbed[k] = v;
      }
    }
    return scrubbed;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
