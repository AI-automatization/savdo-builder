/**
 * Тесты для `MfaEnforcedGuard`.
 * Критично: блокирует mfaPending JWT на всех admin endpoints кроме помеченных
 * `@SkipMfaCheck()`. Любой баг даёт false negative (admin минует MFA).
 */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MfaEnforcedGuard } from './mfa-enforced.guard';
import { SKIP_MFA_KEY } from '../decorators/skip-mfa.decorator';

function makeContext(user: Record<string, unknown> | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => () => {},
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('MfaEnforcedGuard', () => {
  let guard: MfaEnforcedGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<Reflector>;
    guard = new MfaEnforcedGuard(reflector);
  });

  describe('@SkipMfaCheck endpoints', () => {
    it('пропускает если route помечен SKIP_MFA', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext({ sub: 'u1', mfaPending: true });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('обычные endpoints', () => {
    it('пропускает JWT без mfaPending', () => {
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('пропускает JWT с mfaPending: false', () => {
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', mfaPending: false });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('пропускает БЕЗ user (не авторизован — другие guards разберутся)', () => {
      const ctx = makeContext(undefined);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('БРОСАЕТ 403 MFA_REQUIRED если mfaPending: true', () => {
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', mfaPending: true });
      expect(() => guard.canActivate(ctx)).toThrow(/Multi-factor authentication required/);
    });
  });

  describe('integration с SKIP_MFA decorator', () => {
    it('reflector вызван с handler и class scope', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      guard.canActivate(makeContext({ sub: 'u1' }));
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        SKIP_MFA_KEY,
        expect.any(Array),
      );
    });
  });
});
