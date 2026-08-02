import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * P1-1 (audit-2026-06-04): admin задаёт Telegram-канал магазина.
 *
 * Раньше `telegramChannelId` можно было задать ТОЛЬКО через seller TMA
 * (`/seller/settings/channel`). В Admin Panel input отсутствовал → admin не
 * мог вручную привязать канал магазину, у которого продавец не зашёл в TMA.
 * Результат: `postProductToChannel` для всех магазинов в проде возвращал
 * `"Channel not configured"`.
 *
 * Нормализация: `@user`, `user`, `https://t.me/user`, `t.me/user` → `@user`.
 * Числовой `-100xxx` остаётся как есть (формат супергруппы/канала Telegram).
 *
 * INV-A01: audit_log STORE_CHANNEL_UPDATED обязателен.
 */

export interface AdminUpdateStoreChannelInput {
  storeId: string;
  actorUserId: string;
  telegramChannelId?: string;
  telegramChannelTitle?: string;
}

@Injectable()
export class AdminUpdateStoreChannelUseCase {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: AdminUpdateStoreChannelInput) {
    const store = await this.adminRepo.findStoreById(input.storeId);
    if (!store) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const data: Record<string, string | null> = {};

    if (input.telegramChannelId !== undefined) {
      const raw = input.telegramChannelId.trim();
      if (raw === '') {
        data.telegramChannelId = null;
      } else {
        const normalized = AdminUpdateStoreChannelUseCase.normalizeChannelId(raw);
        if (!normalized) {
          throw new DomainException(
            ErrorCode.VALIDATION_ERROR,
            'Invalid Telegram channel format. Use @username or -100... chat_id.',
            HttpStatus.BAD_REQUEST,
          );
        }
        data.telegramChannelId = normalized;
      }
    }

    if (input.telegramChannelTitle !== undefined) {
      const raw = input.telegramChannelTitle.trim();
      data.telegramChannelTitle = raw === '' ? null : raw;
    }

    if (Object.keys(data).length === 0) {
      return {
        id: store.id,
        telegramChannelId: (store as { telegramChannelId?: string | null }).telegramChannelId ?? null,
        telegramChannelTitle: (store as { telegramChannelTitle?: string | null }).telegramChannelTitle ?? null,
      };
    }

    const updated = await this.prisma.store.update({
      where: { id: input.storeId },
      data,
      select: { id: true, telegramChannelId: true, telegramChannelTitle: true },
    });

    await this.adminRepo.writeAuditLog({
      actorUserId: input.actorUserId,
      action: 'STORE_CHANNEL_UPDATED',
      entityType: 'Store',
      entityId: input.storeId,
      payload: {
        previousChannelId: (store as { telegramChannelId?: string | null }).telegramChannelId ?? null,
        previousChannelTitle: (store as { telegramChannelTitle?: string | null }).telegramChannelTitle ?? null,
        newChannelId: updated.telegramChannelId,
        newChannelTitle: updated.telegramChannelTitle,
      },
    });

    return updated;
  }

  /**
   * Возвращает каноничную форму или `null` если формат не распознан.
   *   `@foo`               → `@foo`
   *   `foo`                → `@foo`
   *   `https://t.me/foo`   → `@foo`
   *   `http://t.me/foo`    → `@foo`
   *   `t.me/foo`           → `@foo`
   *   `-1001234567890`     → `-1001234567890`
   *
   * Допустимый username: 5..32 символов, [a-zA-Z0-9_].
   */
  static normalizeChannelId(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Числовой chat_id (Telegram канал = `-100` + 10..13 цифр)
    if (/^-?\d+$/.test(trimmed)) {
      return trimmed;
    }

    // Извлекаем username из любого формата
    const match = trimmed.match(
      /^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?@?([a-zA-Z0-9_]+)\/?$/,
    );
    if (!match) return null;

    const username = match[1];
    if (username.length < 5 || username.length > 32) return null;

    return `@${username}`;
  }
}
