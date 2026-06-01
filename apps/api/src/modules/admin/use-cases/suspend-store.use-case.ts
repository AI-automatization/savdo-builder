/**
 * APPROVED/PENDING_REVIEW/DRAFT/REJECTED → SUSPENDED.
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 * Состояние / контракты:
 *   - guard: `status === 'SUSPENDED'` → ADMIN_STORE_ALREADY_SUSPENDED (409)
 *   - update: `adminRepo.updateStoreStatus(id, 'SUSPENDED')`
 *   - audit: STORE_SUSPENDED, payload `{ reason, adminId, previousStatus }`
 *   - INV-A01 (audit log), INV-A02 (reason обязателен на DTO-level)
 */
import { Store } from '@prisma/client';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';

export class SuspendStoreUseCase extends createStatusTransitionUseCase<Store, StoreStatus>({
  find: (repo, id) => repo.findStoreById(id) as Promise<Store | null>,
  update: (repo, id) => repo.updateStoreStatus(id, 'SUSPENDED') as Promise<Store>,
  guard: {
    kind: 'sameAsTarget',
    target: 'SUSPENDED',
    conflictErrorCode: ErrorCode.ADMIN_STORE_ALREADY_SUSPENDED,
    conflictMessage: 'Store is already suspended',
  },
  notFound: { errorCode: ErrorCode.STORE_NOT_FOUND, message: 'Store not found' },
  audit: { action: 'STORE_SUSPENDED', entityType: 'Store' },
  withReason: true,
  includePreviousStatus: true,
}) {}
