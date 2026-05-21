/**
 * Unit-тесты ErrorReporter. Не бьём по сети — Sentry SDK подменяется через
 * `jest.mock('@sentry/node', ...)`.
 */

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
  setupExpressErrorHandler: jest.fn(),
}));

import * as Sentry from '@sentry/node';
import { ErrorReporter } from './error-reporter';

describe('ErrorReporter', () => {
  let stderrSpy: jest.SpyInstance;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    // Сбрасываем singleton state между тестами через приватные поля.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ErrorReporter as any).initialized = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ErrorReporter as any).sentryEnabled = false;
    (Sentry.init as jest.Mock).mockClear();
    (Sentry.captureException as jest.Mock).mockClear();
    (Sentry.captureMessage as jest.Mock).mockClear();
    (Sentry.flush as jest.Mock).mockClear();
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  describe('init', () => {
    it('init без DSN не падает и Sentry.init не вызывается', () => {
      delete process.env.SENTRY_DSN;
      expect(() => ErrorReporter.init()).not.toThrow();
      expect(Sentry.init).not.toHaveBeenCalled();
      expect(ErrorReporter.isSentryEnabled()).toBe(false);
    });

    it('init с DSN — Sentry.init вызывается с правильными параметрами', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      expect(Sentry.init).toHaveBeenCalledTimes(1);
      const call = (Sentry.init as jest.Mock).mock.calls[0][0];
      expect(call.dsn).toBe('https://abc@sentry.io/1');
      expect(call.tracesSampleRate).toBe(0.1);
      expect(typeof call.beforeSend).toBe('function');
      expect(ErrorReporter.isSentryEnabled()).toBe(true);
    });

    it('idempotent — второй init не вызывает Sentry.init повторно', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      ErrorReporter.init();
      expect(Sentry.init).toHaveBeenCalledTimes(1);
    });

    it('ERROR_REPORTER_ENABLED=false — полный no-op', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      process.env.ERROR_REPORTER_ENABLED = 'false';
      ErrorReporter.init();
      expect(Sentry.init).not.toHaveBeenCalled();
      ErrorReporter.captureException(new Error('x'));
      expect(stderrSpy).not.toHaveBeenCalled();
      delete process.env.ERROR_REPORTER_ENABLED;
    });
  });

  describe('captureException', () => {
    it('без DSN — пишет в stderr, Sentry не вызывается', () => {
      ErrorReporter.init();
      ErrorReporter.captureException(new Error('boom'), { userId: 'u1' });
      expect(stderrSpy).toHaveBeenCalled();
      const payload = JSON.parse(stderrSpy.mock.calls[0][0] as string);
      expect(payload.type).toBe('exception');
      expect(payload.message).toBe('boom');
      expect(payload.context.userId).toBe('u1');
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('с DSN — пишет в stderr И в Sentry', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      const err = new Error('boom');
      ErrorReporter.captureException(err, { userId: 'u1' });
      expect(stderrSpy).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(err, {
        extra: expect.objectContaining({ userId: 'u1' }),
      });
    });

    it('PII-скраббинг: password/token/code → [REDACTED]', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      ErrorReporter.captureException(new Error('boom'), {
        password: 'secret123',
        token: 'jwt.token.here',
        code: '123456',
        userId: 'u1',
      });
      const extra = (Sentry.captureException as jest.Mock).mock.calls[0][1].extra;
      expect(extra.password).toBe('[REDACTED]');
      expect(extra.token).toBe('[REDACTED]');
      expect(extra.code).toBe('[REDACTED]');
      expect(extra.userId).toBe('u1');
    });

    it('phone маскируется через maskPhone', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      ErrorReporter.captureException(new Error('boom'), {
        phone: '+998901234567',
      });
      const extra = (Sentry.captureException as jest.Mock).mock.calls[0][1].extra;
      expect(extra.phone).toBe('+998 *** ** 67');
    });
  });

  describe('captureMessage', () => {
    it('info → stdout, error → stderr', () => {
      ErrorReporter.init();
      ErrorReporter.captureMessage('hi', 'info');
      expect(stdoutSpy).toHaveBeenCalled();
      ErrorReporter.captureMessage('oops', 'error');
      expect(stderrSpy).toHaveBeenCalled();
    });

    it('с DSN дополнительно зеркалит в Sentry.captureMessage', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      ErrorReporter.captureMessage('hi', 'warning', { foo: 'bar' });
      expect(Sentry.captureMessage).toHaveBeenCalledWith('hi', {
        level: 'warning',
        extra: { foo: 'bar' },
      });
    });
  });

  describe('setUser / flush / isSentryEnabled', () => {
    it('setUser no-op без DSN', () => {
      ErrorReporter.init();
      ErrorReporter.setUser('u1');
      expect(Sentry.setUser).not.toHaveBeenCalled();
    });

    it('setUser зовёт Sentry.setUser при активном DSN', () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      ErrorReporter.setUser('u1');
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'u1' });
    });

    it('flush без DSN → true (no-op success)', async () => {
      ErrorReporter.init();
      await expect(ErrorReporter.flush(100)).resolves.toBe(true);
      expect(Sentry.flush).not.toHaveBeenCalled();
    });

    it('flush с DSN зовёт Sentry.flush', async () => {
      process.env.SENTRY_DSN = 'https://abc@sentry.io/1';
      ErrorReporter.init();
      await ErrorReporter.flush(500);
      expect(Sentry.flush).toHaveBeenCalledWith(500);
    });
  });
});
