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
