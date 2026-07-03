import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { seller: true, buyer: true, admin: true },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { seller: true, buyer: true },
    });
  }

  async updateLanguage(userId: string, languageCode: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { languageCode },
    });
  }

  async blockUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' },
    });
  }

  async findPhoneById(userId: string): Promise<string | null> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    return u?.phone ?? null;
  }

  async findBuyerIdByUserId(userId: string): Promise<string | null> {
    const b = await this.prisma.buyer.findUnique({ where: { userId }, select: { id: true } });
    return b?.id ?? null;
  }

  async upsertBuyerAvatar(userId: string, url: string): Promise<{ id: string; avatarUrl: string | null }> {
    return this.prisma.buyer.upsert({
      where: { userId },
      create: { userId, avatarUrl: url },
      update: { avatarUrl: url },
      select: { id: true, avatarUrl: true },
    });
  }

  async syncTelegramId(phone: string, telegramId: bigint): Promise<void> {
    await this.prisma.user.updateMany({ where: { phone }, data: { telegramId } });
  }
}
