import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface SwitchContextInput {
  userId: string;
  sessionId: string;
  context: 'BUYER' | 'SELLER';
}

/**
 * HYBRID-1 (ADR 2026-06-30): меняет АКТИВНЫЙ контекст аккаунта и ре-выдаёт
 * access token с новым role-claim (и storeId для SELLER). Гибридная модель:
 * role = активный контекст, не эксклюзивная роль.
 *
 * Персистим выбранный контекст в users.role — чтобы (а) refresh-session
 * (читает user.role из БД) сохранял контекст, (б) бот/TMA дефолтили на
 * последний активный контекст (HYBRID-3 — единый источник истины).
 *
 * Инварианты:
 *  - SELLER требует активный магазин (findStoreIdByUserId). Нет магазина → 400.
 *    Соответствует «нет магазина → нельзя переключиться в продавца».
 *  - BUYER доступен всегда; buyer-профиль гарантируется (ensureBuyerProfile).
 *  - ADMIN не переключает контекст (работает в admin-панели) → 400.
 *  - BLOCKED / soft-deleted → 401 (access token мог пережить бан до TTL).
 */
@Injectable()
export class SwitchContextUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: SwitchContextInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, role: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new DomainException(ErrorCode.UNAUTHORIZED, 'User not found', HttpStatus.UNAUTHORIZED);
    }
    if (user.status === 'BLOCKED') {
      throw new DomainException(ErrorCode.UNAUTHORIZED, 'Account is suspended', HttpStatus.FORBIDDEN);
    }
    if (user.role === 'ADMIN') {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Admin accounts do not switch context',
        HttpStatus.BAD_REQUEST,
      );
    }

    const context = input.context as UserRole;
    let storeId: string | undefined;

    if (context === 'SELLER') {
      const sid = await this.authRepo.findStoreIdByUserId(input.userId);
      if (!sid) {
        throw new DomainException(
          ErrorCode.VALIDATION_ERROR,
          'No store — create a store before switching to seller',
          HttpStatus.BAD_REQUEST,
        );
      }
      storeId = sid;
    } else {
      await this.authRepo.ensureBuyerProfile(input.userId);
    }

    // Персистим активный контекст как дефолт (idempotent — пишем только при смене).
    if (user.role !== context) {
      await this.prisma.user.update({
        where: { id: input.userId },
        data: { role: context },
        select: { id: true },
      });
    }

    const token = this.tokenService.generateAccessToken({
      sub: input.userId,
      role: context,
      sessionId: input.sessionId,
      ...(storeId && { storeId }),
    });

    return { token, role: context, ...(storeId && { storeId }) };
  }
}
