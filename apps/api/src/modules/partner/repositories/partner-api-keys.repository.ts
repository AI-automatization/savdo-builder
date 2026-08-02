import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PartnerApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { keyHash: string; name: string; storeId: string }) {
    return this.prisma.partnerApiKey.create({ data });
  }

  // Guard hot path: ключ + store + userId владельца (нужен как ownerUserId
  // для media upload). Только активные ключи живых магазинов.
  async findActiveByHash(keyHash: string) {
    return this.prisma.partnerApiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
        store: { deletedAt: null },
      },
      include: {
        store: {
          select: {
            id: true,
            slug: true,
            seller: { select: { id: true, userId: true, isBlocked: true } },
          },
        },
      },
    });
  }

  // Fire-and-forget из guard'а — не блокирует запрос.
  async touchLastUsed(id: string) {
    await this.prisma.partnerApiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async findAll() {
    return this.prisma.partnerApiKey.findMany({
      select: {
        id: true,
        name: true,
        storeId: true,
        isActive: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        store: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.partnerApiKey.findUnique({ where: { id } });
  }

  async revoke(id: string) {
    return this.prisma.partnerApiKey.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });
  }
}
