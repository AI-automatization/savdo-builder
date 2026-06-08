import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * ACCOUNT-DELETION-OTP-001: тонкий репозиторий для account_deletion_otps.
 * Бизнес-логика (rate-limit, expiry, hash compare) живёт в use-cases.
 */
@Injectable()
export class AccountDeletionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOtp(data: { userId: string; codeHash: string; expiresAt: Date }) {
    return this.prisma.accountDeletionOtp.create({ data });
  }

  async findActiveOtp(userId: string) {
    return this.prisma.accountDeletionOtp.findFirst({
      where: {
        userId,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementAttempt(id: string) {
    return this.prisma.accountDeletionOtp.update({
      where: { id },
      data: { attemptCount: { increment: 1 } },
    });
  }

  async consumeOtp(id: string) {
    return this.prisma.accountDeletionOtp.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async countRecentOtps(userId: string, since: Date) {
    return this.prisma.accountDeletionOtp.count({
      where: { userId, createdAt: { gte: since } },
    });
  }

  /**
   * Атомарно: soft-delete user + invalidate all sessions.
   * Зеркалит логику apps/api/src/modules/admin/use-cases/db-manager.use-case.ts
   * (deleteRow case 'users') — но запускается самим юзером, без admin-аудита.
   */
  async softDeleteUserTx(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          status: 'BLOCKED',
        },
        select: { id: true, telegramId: true, phone: true },
      });
      await tx.userSession.deleteMany({ where: { userId } });
      return user;
    });
  }
}
