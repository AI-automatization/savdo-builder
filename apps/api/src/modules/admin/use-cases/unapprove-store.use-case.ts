/**
 * APPROVED → DRAFT (снимаем с публикации).
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 *   - guard: только из APPROVED, иначе STORE_INVALID_TRANSITION (409)
 *   - update: `adminRepo.unapproveStore(id)` (status=DRAFT, isPublic=false)
 *   - audit: STORE_UNAPPROVED, payload `{ adminId }`
 */
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
type Store = { id: string; status: StoreStatus };

export class UnapproveStoreUseCase extends createStatusTransitionUseCase<Store, StoreStatus>({
  find: (repo, id) => repo.findStoreById(id) as Promise<Store | null>,
  update: (repo, id) => repo.unapproveStore(id) as Promise<Store>,
  guard: {
    kind: 'notInFromList',
    fromStatuses: ['APPROVED'],
    conflictErrorCode: ErrorCode.STORE_INVALID_TRANSITION,
    conflictMessage: 'Only approved stores can be unapproved',
  },
  notFound: { errorCode: ErrorCode.STORE_NOT_FOUND, message: 'Store not found' },
  audit: { action: 'STORE_UNAPPROVED', entityType: 'Store' },
  withReason: false,
  includePreviousStatus: false,
}) {}
