/**
 * Generic factory for admin "change-entity-status" use-cases.
 *
 * Все 8 use-cases (suspend/unsuspend/archive/reject/approve/unapprove store +
 * suspend/unsuspend user) делают одно и то же: load entity → state guard →
 * mutate → write INV-A01 audit log. Разница только в литералах статуса,
 * action-коде, методе мутации и наборе error-codes для guard.
 *
 * Фабрика собирает Injectable class на основе config. Контракт AuditLog
 * (actorUserId/action/entityType/entityId/payload) — не меняется.
 *
 * См. analiz/dry-audit-2026-06-01.md → DUP-001.
 */
import { Injectable, HttpStatus, Type } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCodeType } from '../../../shared/constants/error-codes';

/**
 * Каждый use-case реализует одну из двух форм проверки текущего статуса:
 *  - `'sameAsTarget'`  → если `entity.status === target` → already-X (CONFLICT)
 *    (suspend, archive, reject)
 *  - `'notInFromList'` → если `entity.status` НЕ в `fromStatuses` → invalid-transition (CONFLICT)
 *    (unsuspend, approve, unapprove, *user*)
 */
type GuardSpec<TStatus extends string> =
  | {
      kind: 'sameAsTarget';
      /** Литерал target-статуса (e.g. 'SUSPENDED'). */
      target: TStatus;
      /** Error-код для already-в-этом-статусе (CONFLICT). */
      conflictErrorCode: ErrorCodeType;
      /** Сообщение для already-в-этом-статусе. */
      conflictMessage: string;
    }
  | {
      kind: 'notInFromList';
      /** Допустимые исходные статусы. */
      fromStatuses: readonly TStatus[];
      /** Error-код для невалидной transition (CONFLICT). */
      conflictErrorCode: ErrorCodeType;
      /** Сообщение для невалидной transition. */
      conflictMessage: string;
    };

export interface StatusTransitionConfig<TEntity extends { status: string }, TStatus extends string> {
  /** Найти сущность; вернуть `null` если не найдена. */
  find: (repo: AdminRepository, entityId: string) => Promise<TEntity | null>;
  /** Применить мутацию статуса и вернуть обновлённую сущность. */
  update: (repo: AdminRepository, entityId: string) => Promise<TEntity>;
  /** Guard для проверки текущего статуса (см. `GuardSpec`). */
  guard: GuardSpec<TStatus>;
  /** Error-код / сообщение для NOT_FOUND. */
  notFound: { errorCode: ErrorCodeType; message: string };
  /** Audit-log поля. `entityType` — `'Store'` / `'User'`. */
  audit: { action: string; entityType: string };
  /**
   * Принимает ли use-case `reason: string`. Если `true`, signature будет
   * `execute(entityId, actorUserId, reason)`. Если `false` —
   * `execute(entityId, actorUserId)`. Совпадает с поведением исходных файлов.
   */
  withReason: boolean;
  /**
   * Класть ли `previousStatus` в audit payload. У suspend/archive/reject —
   * `true`; у unsuspend / approve / unapprove / *user* — `false`.
   */
  includePreviousStatus: boolean;
  /**
   * Опциональный side-effect, выполняемый ПОСЛЕ update и audit-log.
   * На текущий момент ни один use-case не использует. Зарезервировано
   * под будущие side-effects (revoke sessions, hide products) без дрейфа кода.
   */
  postEffect?: (
    repo: AdminRepository,
    ctx: { entityId: string; actorUserId: string; reason?: string; previous: TEntity; updated: TEntity },
  ) => Promise<void>;
}

/**
 * Создаёт NestJS Injectable use-case class из config-а.
 *
 * Использование:
 * ```ts
 * @Injectable()
 * export class SuspendStoreUseCase extends createStatusTransitionUseCase<Store, StoreStatus>({...}) {}
 * ```
 */
export function createStatusTransitionUseCase<
  TEntity extends { status: string },
  TStatus extends string,
>(config: StatusTransitionConfig<TEntity, TStatus>): Type<{
  execute(entityId: string, actorUserId: string, reason?: string): Promise<TEntity>;
}> {
  @Injectable()
  class StatusTransitionUseCase {
    constructor(protected readonly adminRepo: AdminRepository) {}

    // INV-A01: AuditLog обязателен для каждого admin action.
    // INV-A02: где требуется reason — он приходит из AdminActionDto.
    async execute(entityId: string, actorUserId: string, reason?: string): Promise<TEntity> {
      const entity = await config.find(this.adminRepo, entityId);
      if (!entity) {
        throw new DomainException(
          config.notFound.errorCode,
          config.notFound.message,
          HttpStatus.NOT_FOUND,
        );
      }

      // ── Guard на текущий статус ───────────────────────────────────────
      if (config.guard.kind === 'sameAsTarget') {
        if (entity.status === config.guard.target) {
          throw new DomainException(
            config.guard.conflictErrorCode,
            config.guard.conflictMessage,
            HttpStatus.CONFLICT,
          );
        }
      } else {
        if (!(config.guard.fromStatuses as readonly string[]).includes(entity.status)) {
          throw new DomainException(
            config.guard.conflictErrorCode,
            config.guard.conflictMessage,
            HttpStatus.CONFLICT,
          );
        }
      }

      // ── Mutate ─────────────────────────────────────────────────────────
      const updated = await config.update(this.adminRepo, entityId);

      // ── Audit log (INV-A01). Payload сохраняет точный shape исходников. ──
      await this.adminRepo.writeAuditLog({
        actorUserId,
        action: config.audit.action,
        entityType: config.audit.entityType,
        entityId,
        payload: buildAuditPayload(config, {
          reason,
          actorUserId,
          previousStatus: entity.status,
        }),
      });

      if (config.postEffect) {
        await config.postEffect(this.adminRepo, {
          entityId,
          actorUserId,
          reason,
          previous: entity,
          updated,
        });
      }

      return updated;
    }
  }

  return StatusTransitionUseCase;
}

/**
 * Аккуратно собирает audit payload в порядке `{ reason?, adminId, previousStatus? }`
 * чтобы snapshot-тесты (если когда-нибудь появятся) и логи читались идентично
 * историческим записям до рефакторинга.
 */
function buildAuditPayload<TEntity extends { status: string }, TStatus extends string>(
  config: StatusTransitionConfig<TEntity, TStatus>,
  ctx: { reason?: string; actorUserId: string; previousStatus: string },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (config.withReason && ctx.reason !== undefined) {
    payload.reason = ctx.reason;
  }
  payload.adminId = ctx.actorUserId;
  if (config.includePreviousStatus) {
    payload.previousStatus = ctx.previousStatus;
  }
  return payload;
}
