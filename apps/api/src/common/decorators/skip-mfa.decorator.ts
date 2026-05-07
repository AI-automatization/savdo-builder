import { SetMetadata } from '@nestjs/common';

export const SKIP_MFA_KEY = 'skipMfaCheck';

/**
 * API-MFA-NOT-ENFORCED-001: помечает endpoint как доступный с mfaPending JWT.
 * Используется только для:
 *   - GET /admin/auth/me — клиент должен знать свой mfaEnabled статус
 *   - POST /admin/auth/mfa/login — собственно challenge endpoint
 *   - POST /admin/auth/mfa/setup/verify/disable — управление MFA
 *
 * Любой другой admin endpoint с mfaPending=true блокируется MfaEnforcedGuard.
 */
export const SkipMfaCheck = () => SetMetadata(SKIP_MFA_KEY, true);
