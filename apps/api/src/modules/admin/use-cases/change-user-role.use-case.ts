import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface ChangeUserRoleInput {
  userId: string;
  role: 'BUYER' | 'SELLER';
  actorUserId: string;
  reason?: string;
}

/**
 * HYBRID-4 (ADR 2026-06-30 «Гибридная модель ролей»): меняет дефолтный контекст
 * (users.role) пользователя. NON-DESTRUCTIVE — это ключ гибридной модели: обе
 * способности (buyer/seller) сосуществуют, поэтому смена дефолта НЕ разрушает
 * профиль другой стороны и магазин.
 *
 * Инварианты:
 *  - target SELLER требует наличия seller-профиля. Без него TMA-логика storeId
 *    (telegram-auth.use-case.ts:187) и ~30 @Roles('SELLER') эндпоинтов работать
 *    не смогут. Сообщаем явно: сначала make-seller.
 *  - target BUYER всегда допустим, но гарантируем наличие buyer-профиля (иначе
 *    @Roles('BUYER') flow упадёт на отсутствии buyer-записи). Seller-профиль и
 *    магазин при этом сохраняются.
 *  - ADMIN сюда не приходит (отбит DTO IsIn) — эскалация только через super_admin.
 *
 * Пишет audit_log (INV-A01) с payload { from, to, reason }.
 */
@Injectable()
export class ChangeUserRoleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ChangeUserRoleInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      include: { seller: true, buyer: true },
    });

    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    if (user.role === 'ADMIN') {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Cannot change role of an admin account here',
        HttpStatus.BAD_REQUEST,
      );
    }

    const from = user.role;
    const to = input.role as UserRole;

    if (from === to) {
      throw new DomainException(
        ErrorCode.CONFLICT,
        `User already has role ${to}`,
        HttpStatus.CONFLICT,
      );
    }

    if (to === 'SELLER' && !user.seller) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'User has no seller profile — use make-seller first',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.$transaction(async (db) => {
      // BUYER target: гарантируем buyer-профиль (non-destructive — seller/store
      // не трогаем). upsert идемпотентен.
      if (to === 'BUYER' && !user.buyer) {
        await db.buyer.create({ data: { userId: input.userId } });
      }

      const u = await db.user.update({
        where: { id: input.userId },
        data: { role: to },
        select: { id: true, role: true, phone: true, status: true },
      });

      await db.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          actorType: 'admin',
          action: 'admin.change_user_role',
          entityType: 'User',
          entityId: input.userId,
          payload: { from, to, ...(input.reason ? { reason: input.reason } : {}) },
        },
      });

      return u;
    });

    return updated;
  }
}
