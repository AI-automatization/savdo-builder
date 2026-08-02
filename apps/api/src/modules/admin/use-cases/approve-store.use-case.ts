/**
 * PENDING_REVIEW | DRAFT → APPROVED (с публикацией).
 *
 * Реализовано через `createStatusTransitionUseCase` (DUP-001 refactor).
 * Отличается тем что update делает не `updateStoreStatus`, а
 * `approveAndPublishStore` (status=APPROVED + isPublic=true + publishedAt).
 *   - guard: fromStatuses = PENDING_REVIEW | DRAFT, иначе STORE_INVALID_TRANSITION (409)
 *   - audit: STORE_APPROVED, payload `{ adminId }` (без reason, без previousStatus)
 */
import { Store } from '@prisma/client';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { createStatusTransitionUseCase } from '../services/admin-status-transition.factory';

type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';

export class ApproveStoreUseCase extends createStatusTransitionUseCase<Store, StoreStatus>({
  find: (repo, id) => repo.findStoreById(id) as Promise<Store | null>,
  update: (repo, id) => repo.approveAndPublishStore(id) as Promise<Store>,
  guard: {
    kind: 'notInFromList',
    fromStatuses: ['PENDING_REVIEW', 'DRAFT'],
    conflictErrorCode: ErrorCode.STORE_INVALID_TRANSITION,
    conflictMessage: 'Store cannot be approved from current status',
  },
  notFound: { errorCode: ErrorCode.STORE_NOT_FOUND, message: 'Store not found' },
  audit: { action: 'STORE_APPROVED', entityType: 'Store' },
  withReason: false,
  includePreviousStatus: false,
}) {}
