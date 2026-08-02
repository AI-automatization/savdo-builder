/**
 * any-not-REJECTED → REJECTED.
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 *   - guard: `status === 'REJECTED'` → ADMIN_STORE_ALREADY_REJECTED (409)
 *   - update: `adminRepo.updateStoreStatus(id, 'REJECTED')`
 *   - audit: STORE_REJECTED, payload `{ reason, adminId, previousStatus }`
 *   - INV-A02: reason обязателен на DTO-level
 */
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
type Store = { id: string; status: StoreStatus };

export class RejectStoreUseCase extends createStatusTransitionUseCase<Store, StoreStatus>({
  find: (repo, id) => repo.findStoreById(id) as Promise<Store | null>,
  update: (repo, id) => repo.updateStoreStatus(id, 'REJECTED') as Promise<Store>,
  guard: {
    kind: 'sameAsTarget',
    target: 'REJECTED',
    conflictErrorCode: ErrorCode.ADMIN_STORE_ALREADY_REJECTED,
    conflictMessage: 'Store is already rejected',
  },
  notFound: { errorCode: ErrorCode.STORE_NOT_FOUND, message: 'Store not found' },
  audit: { action: 'STORE_REJECTED', entityType: 'Store' },
  withReason: true,
  includePreviousStatus: true,
}) {}
