import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── AdminUser ─────────────────────────────────────────────────────────────

  async findAdminByUserId(userId: string) {
    return this.prisma.adminUser.findUnique({
      where: { userId },
    });
  }

  // ── AuditLog ──────────────────────────────────────────────────────────────

  async writeAuditLog(data: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    payload?: object;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: data.actorUserId,
        actorType: 'admin',
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        payload: data.payload ?? {},
      },
    });
  }

  async findAuditLogs(filters: {
    actorUserId?: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // ── User operations ───────────────────────────────────────────────────────

  async findUsers(filters: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.role ? { role: filters.role as any } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          role: true,
          status: true,
          isPhoneVerified: true,
          languageCode: true,
          createdAt: true,
          updatedAt: true,
          seller: { select: { telegramChatId: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        seller: true,
        buyer: true,
        admin: true,
      },
    });
  }

  async setUserStatus(id: string, status: 'ACTIVE' | 'BLOCKED') {
    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
  }

  // ── Seller operations ─────────────────────────────────────────────────────

  async findSellers(filters: {
    verificationStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.verificationStatus
        ? { verificationStatus: filters.verificationStatus as any }
        : {}),
    };

    const [sellers, total] = await this.prisma.$transaction([
      this.prisma.seller.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { id: true, phone: true, status: true } } },
      }),
      this.prisma.seller.count({ where }),
    ]);

    return { sellers, total };
  }

  async findSellerById(id: string) {
    const [seller, moderationCases] = await this.prisma.$transaction([
      this.prisma.seller.findUnique({
        where: { id },
        include: { user: true, store: true },
      }),
      this.prisma.moderationCase.findMany({
        where: { entityType: 'seller', entityId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          actions: {
            orderBy: { createdAt: 'asc' },
            include: {
              adminUser: { select: { id: true, isSuperadmin: true, user: { select: { phone: true } } } },
            },
          },
        },
      }),
    ]);
    if (!seller) return null;
    return { ...seller, moderationCases };
  }

  async updateSellerVerification(id: string, status: string) {
    return this.prisma.seller.update({
      where: { id },
      data: { verificationStatus: status as any },
    });
  }

  async blockSeller(id: string, reason: string) {
    return this.prisma.seller.update({
      where: { id },
      data: { isBlocked: true, blockedReason: reason },
    });
  }

  async unblockSeller(id: string) {
    return this.prisma.seller.update({
      where: { id },
      data: { isBlocked: false, blockedReason: null },
    });
  }

  // ── Store operations ──────────────────────────────────────────────────────

  async findStores(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.status ? { status: filters.status as any } : {}),
    };

    const [stores, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, fullName: true, verificationStatus: true } },
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    return { stores, total };
  }

  async findStoreById(id: string) {
    return this.prisma.store.findUnique({
      where: { id },
      include: {
        seller: { include: { user: true } },
        contacts: true,
        deliverySettings: true,
      },
    });
  }

  async updateStoreStatus(id: string, status: string) {
    return this.prisma.store.update({
      where: { id },
      data: { status: status as any },
    });
  }

  // ── Global search ─────────────────────────────────────────────────────────

  async globalSearch(q: string) {
    const [users, orders, stores] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { phone: { contains: q } },
        select: { id: true, phone: true, role: true, status: true },
        take: 5,
      }),
      this.prisma.order.findMany({
        where: { orderNumber: { contains: q, mode: 'insensitive' } },
        include: { store: { select: { name: true } } },
        orderBy: { placedAt: 'desc' },
        take: 5,
      }),
      this.prisma.store.findMany({
        where: {
          OR: [
            { slug: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { seller: { select: { id: true, fullName: true } } },
        take: 5,
      }),
    ]);

    return { users, orders, stores };
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  async listOrders(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where = {
      ...(filters.status ? { status: filters.status as any } : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip,
        take: limit,
        include: {
          store: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }
}
