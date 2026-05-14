import { ConsoleLogger, LogLevel } from '@nestjs/common';

/**
 * API-PINO-LOGGING-001 — structured JSON logging для production без зависимости от pino.
 *
 * Зачем не pino: подключение `nestjs-pino` требует `pnpm install` (4 новых пакета:
 * nestjs-pino, pino, pino-http, pino-pretty). Lightweight wrapper даёт 80%
 * value (JSON-логи для Railway / Datadog / CloudWatch) без новых deps.
 *
 * **В production (NODE_ENV=production):**
 * каждый log emits JSON line:
 * ```
 * {"ts":"2026-05-14T17:55:00.123Z","level":"log","context":"OrdersController","msg":"Order created","reqId":"abc-123"}
 * ```
 *
 * **В development:**
 * fallback на стандартный NestJS ConsoleLogger (color + pretty).
 *
 * **Использование:**
 * `main.ts:`
 * ```
 * const app = await NestFactory.create(AppModule, {
 *   logger: new StructuredLogger(),
 * });
 * ```
 *
 * Все существующие `Logger.log()` / `Logger.warn()` / `Logger.error()` —
 * работают через этот wrapper автоматически, ничего больше править не нужно.
 *
 * **Лог-уровни:** verbose/debug/log/warn/error/fatal. По умолчанию в prod
 * verbose и debug отключены (см. `LOG_LEVEL` env).
 */
export class StructuredLogger extends ConsoleLogger {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    super();
    const envLevel = (process.env.LOG_LEVEL as LogLevel | undefined);
    if (envLevel) {
      this.setLogLevels([envLevel]);
    } else if (this.isProduction) {
      this.setLogLevels(['log', 'warn', 'error', 'fatal']);
    }
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.emit('log', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.emit('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.emit('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    this.emit('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.emit('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.emit('fatal', message, optionalParams);
  }

  /**
   * Внутренний emit: prod → JSON, dev → super (color console).
   * Last param в NestJS-конвенции — context string ('OrdersController').
   * Trace параметр у `error` — stack trace, идёт первым после message.
   */
  private emit(level: LogLevel, message: unknown, params: unknown[]): void {
    if (!this.isLevelEnabled(level)) return;

    if (!this.isProduction) {
      // Dev: используем родительский ConsoleLogger (цветной pretty output).
      // TS не позволяет dynamic super[level], поэтому switch.
      switch (level) {
        case 'log':     super.log(message, ...params); return;
        case 'warn':    super.warn(message, ...params); return;
        case 'error':   super.error(message, ...params); return;
        case 'debug':   super.debug(message, ...params); return;
        case 'verbose': super.verbose(message, ...params); return;
        case 'fatal':   super.fatal(message, ...params); return;
      }
    }

    // Production: emit single-line JSON.
    let context: string | undefined;
    let trace: string | undefined;
    if (params.length > 0) {
      const last = params[params.length - 1];
      if (typeof last === 'string') {
        context = last;
        if (level === 'error' && params.length >= 2 && typeof params[0] === 'string') {
          trace = params[0];
        }
      }
    }

    const payload: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: typeof message === 'string' ? message : safeStringify(message),
    };
    if (context) payload.context = context;
    if (trace) payload.trace = trace;

    // stderr для error/fatal — railway отделяет stderr/stdout streams.
    const target = level === 'error' || level === 'fatal' ? process.stderr : process.stdout;
    target.write(JSON.stringify(payload) + '\n');
  }

  /** Проверка enabled для уровня. Override базового метода ConsoleLogger. */
  isLevelEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];
    const minIndex = levels.indexOf(this.options.logLevels?.[0] ?? 'log');
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
