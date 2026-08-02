/**
 * ACTIVE → BLOCKED (user-level suspend).
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 *   - guard: `status === 'BLOCKED'` → ADMIN_USER_ALREADY_SUSPENDED (409)
 *   - update: `adminRepo.setUserStatus(id, 'BLOCKED')`
 *   - audit: USER_SUSPENDED, payload `{ reason, adminId }`
 *   - INV-A02: reason обязателен на DTO-level
 */
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type UserStatus = 'ACTIVE' | 'BLOCKED';
type User = { id: string; status: UserStatus };

export class SuspendUserUseCase extends createStatusTransitionUseCase<User, UserStatus>({
  find: (repo, id) => repo.findUserById(id) as Promise<User | null>,
  update: (repo, id) => repo.setUserStatus(id, 'BLOCKED') as Promise<User>,
  guard: {
    kind: 'sameAsTarget',
    target: 'BLOCKED',
    conflictErrorCode: ErrorCode.ADMIN_USER_ALREADY_SUSPENDED,
    conflictMessage: 'User is already suspended',
  },
  notFound: { errorCode: ErrorCode.NOT_FOUND, message: 'User not found' },
  audit: { action: 'USER_SUSPENDED', entityType: 'User' },
  withReason: true,
  includePreviousStatus: false,
}) {}
