import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOtpRequest(data: {
    phone: string;
    codeHash: string;
    purpose: string;
    expiresAt: Date;
  }) {
    return this.prisma.otpRequest.create({ data });
  }

  async findActiveOtpRequest(phone: string, purpose: string) {
    return this.prisma.otpRequest.findFirst({
      where: {
        phone,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async consumeOtpRequest(id: string) {
    return this.prisma.otpRequest.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async countRecentOtpRequests(phone: string, since: Date): Promise<number> {
    return this.prisma.otpRequest.count({
      where: { phone, createdAt: { gte: since } },
    });
  }

  async findUserByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { seller: true, buyer: true, admin: true },
    });
  }

  async findUserByTelegramId(telegramId: bigint) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      include: { seller: true, buyer: true },
    });
  }

  async createUserWithBuyerByTelegram(data: { telegramId: bigint; phone?: string }) {
    const phone = data.phone ?? `tg_${data.telegramId}`;
    return this.prisma.user.create({
      data: {
        phone,
        telegramId: data.telegramId,
        role: 'BUYER',
        isPhoneVerified: false,
        buyer: { create: {} },
      },
      include: { buyer: true, seller: true },
    });
  }

  async linkTelegramId(userId: string, telegramId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { telegramId },
      include: { buyer: true, seller: true },
    });
  }

  // Убирает telegramId у ghost-аккаунта (phone вида tg_XXX), чтобы не было unique conflict
  async clearTelegramIdIfGhost(telegramId: bigint) {
    return this.prisma.user.updateMany({
      where: {
        telegramId,
        phone: { startsWith: 'tg_' },
      },
      data: { telegramId: null },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, phone: true, isPhoneVerified: true, role: true },
    });
  }

  async createUserWithSeller(data: { phone: string }) {
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        role: 'SELLER',
        isPhoneVerified: true,
        seller: { create: { fullName: '', sellerType: 'individual', telegramUsername: '' } },
      },
      include: { seller: true },
    });
  }

  async createUserWithBuyer(data: { phone: string }) {
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        role: 'BUYER',
        isPhoneVerified: true,
        buyer: { create: {} },
      },
      include: { buyer: true },
    });
  }

  async createSession(data: {
    id?: string;
    userId: string;
    refreshTokenHash: string;
    deviceType?: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return this.prisma.userSession.create({ data });
  }

  async findSessionById(id: string) {
    return this.prisma.userSession.findUnique({ where: { id } });
  }

  async deleteSession(id: string) {
    return this.prisma.userSession.delete({ where: { id } });
  }

  async updateSessionLastSeen(id: string) {
    return this.prisma.userSession.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }
}
