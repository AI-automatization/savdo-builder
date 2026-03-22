import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SellersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.seller.findUnique({
      where: { userId },
      include: { user: true, store: true },
    });
  }

  async findById(id: string) {
    return this.prisma.seller.findUnique({
      where: { id },
      include: { user: true, store: true },
    });
  }

  async updateProfile(sellerId: string, data: {
    fullName?: string;
    sellerType?: string;
    telegramUsername?: string;
  }) {
    return this.prisma.seller.update({
      where: { id: sellerId },
      data,
      include: { user: true },
    });
  }

  async setTelegramChatId(sellerId: string, chatId: bigint) {
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { telegramChatId: chatId, telegramNotificationsActive: true },
    });
  }

  async updateVerificationStatus(sellerId: string, status: string) {
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { verificationStatus: status as any },
    });
  }

  async blockSeller(sellerId: string, reason: string) {
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { isBlocked: true, blockedReason: reason },
    });
  }

  async unblockSeller(sellerId: string) {
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { isBlocked: false, blockedReason: null },
    });
  }
}
