/**
 * any-not-ARCHIVED → ARCHIVED.
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 *   - guard: `status === 'ARCHIVED'` → ADMIN_STORE_ALREADY_ARCHIVED (409)
 *   - update: `adminRepo.updateStoreStatus(id, 'ARCHIVED')`
 *   - audit: STORE_ARCHIVED, payload `{ reason, adminId, previousStatus }`
 *   - INV-A02: reason обязателен на DTO-level
 */
import { Store } from '@prisma/client';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';

export class ArchiveStoreUseCase extends createStatusTransitionUseCase<Store, StoreStatus>({
  find: (repo, id) => repo.findStoreById(id) as Promise<Store | null>,
  update: (repo, id) => repo.updateStoreStatus(id, 'ARCHIVED') as Promise<Store>,
  guard: {
    kind: 'sameAsTarget',
    target: 'ARCHIVED',
    conflictErrorCode: ErrorCode.ADMIN_STORE_ALREADY_ARCHIVED,
    conflictMessage: 'Store is already archived',
  },
  notFound: { errorCode: ErrorCode.STORE_NOT_FOUND, message: 'Store not found' },
  audit: { action: 'STORE_ARCHIVED', entityType: 'Store' },
  withReason: true,
  includePreviousStatus: true,
}) {}
