/**
 * SUSPENDED → APPROVED.
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 *   - guard: только из `SUSPENDED`, иначе STORE_INVALID_TRANSITION (409)
 *   - update: `adminRepo.updateStoreStatus(id, 'APPROVED')`
 *   - audit: STORE_UNSUSPENDED, payload `{ reason, adminId }` (без previousStatus)
 */
import { Store } from '@prisma/client';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';

export class UnsuspendStoreUseCase extends createStatusTransitionUseCase<Store, StoreStatus>({
  find: (repo, id) => repo.findStoreById(id) as Promise<Store | null>,
  update: (repo, id) => repo.updateStoreStatus(id, 'APPROVED') as Promise<Store>,
  guard: {
    kind: 'notInFromList',
    fromStatuses: ['SUSPENDED'],
    conflictErrorCode: ErrorCode.STORE_INVALID_TRANSITION,
    conflictMessage: 'Store is not suspended',
  },
  notFound: { errorCode: ErrorCode.STORE_NOT_FOUND, message: 'Store not found' },
  audit: { action: 'STORE_UNSUSPENDED', entityType: 'Store' },
  withReason: true,
  includePreviousStatus: false,
}) {}
