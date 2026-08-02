/**
 * BLOCKED → ACTIVE (user-level unsuspend).
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 *   - guard: `status === 'ACTIVE'` → NOT_FOUND* (409, сохраняем legacy-поведение)
 *     *исторический баг: оригинальный код бросал ErrorCode.NOT_FOUND с CONFLICT.
 *     Намеренно сохранено для backward-compat с фронтом и API contract'ом.
 *   - update: `adminRepo.setUserStatus(id, 'ACTIVE')`
 *   - audit: USER_UNSUSPENDED, payload `{ reason, adminId }`
 */
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type UserStatus = 'ACTIVE' | 'BLOCKED';
type User = { id: string; status: UserStatus };

export class UnsuspendUserUseCase extends createStatusTransitionUseCase<User, UserStatus>({
  find: (repo, id) => repo.findUserById(id) as Promise<User | null>,
  update: (repo, id) => repo.setUserStatus(id, 'ACTIVE') as Promise<User>,
  guard: {
    kind: 'sameAsTarget',
    target: 'ACTIVE',
    conflictErrorCode: ErrorCode.NOT_FOUND, // legacy code reused NOT_FOUND for 409
    conflictMessage: 'User is not suspended',
  },
  notFound: { errorCode: ErrorCode.NOT_FOUND, message: 'User not found' },
  audit: { action: 'USER_UNSUSPENDED', entityType: 'User' },
  withReason: true,
  includePreviousStatus: false,
}) {}
