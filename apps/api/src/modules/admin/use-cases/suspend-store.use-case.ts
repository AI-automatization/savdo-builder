/**
 * APPROVED → SUSPENDED.
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 * Состояние / контракты:
 *   - guard: только из APPROVED; иначе STORE_INVALID_TRANSITION (409)
 *     Причина: unsuspend всегда возвращает в APPROVED — без сохранения previousStatus
 *     нельзя гарантировать корректный rollback для DRAFT/PENDING_REVIEW магазинов.
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
    kind: 'notInFromList',
    fromStatuses: ['APPROVED'],
    conflictErrorCode: ErrorCode.STORE_INVALID_TRANSITION,
    conflictMessage: 'Only approved stores can be suspended',
  },
  notFound: { errorCode: ErrorCode.STORE_NOT_FOUND, message: 'Store not found' },
  audit: { action: 'STORE_SUSPENDED', entityType: 'Store' },
  withReason: true,
  includePreviousStatus: true,
}) {}
