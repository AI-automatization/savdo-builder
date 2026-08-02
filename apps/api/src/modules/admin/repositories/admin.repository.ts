import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { toPrismaPagination } from '../../../common/utils/pagination';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AdminRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── AdminUser ─────────────────────────────────────────────────────────────

  async findAdminByUserId(userId: string) {
    return this.prisma.adminUser.findUnique({
      where: { userId },
    });
  }

  // ── AuditLog ──────────────────────────────────────────────────────────────

  // FEAT-CATEGORY-JOURNAL-001: делегирует в общий AuditService (запись вынесена,
  // сигнатура сохранена — все admin-вызовы работают без изменений).
  async writeAuditLog(data: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    payload?: object;
  }) {
    return this.audit.write({ ...data, actorType: 'admin' });
  }

  async findAuditLogs(filters: {
    actorUserId?: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = toPrismaPagination(filters);

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

  // ── FEAT-CUSTOM-ROLES-001: кастомные admin-роли ────────────────────────────

  async listCustomRoles() {
    return this.prisma.adminCustomRole.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findCustomRoleByName(name: string) {
    return this.prisma.adminCustomRole.findUnique({ where: { name } });
  }

  async findCustomRoleById(id: string) {
    return this.prisma.adminCustomRole.findUnique({ where: { id } });
  }

  async createCustomRole(data: { name: string; label: string; permissions: string[]; createdByAdminId?: string }) {
    return this.prisma.adminCustomRole.create({ data });
  }

  async updateCustomRole(id: string, data: { label?: string; permissions?: string[] }) {
    return this.prisma.adminCustomRole.update({ where: { id }, data });
  }

  async deleteCustomRole(id: string) {
    return this.prisma.adminCustomRole.delete({ where: { id } });
  }

  /** Сколько админов сейчас на этой роли (по имени = AdminUser.adminRole). */
  async countAdminsWithRole(roleName: string) {
    return this.prisma.adminUser.count({ where: { adminRole: roleName } });
  }

  // ── User operations ───────────────────────────────────────────────────────

  async findUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = toPrismaPagination(filters);

    const where = {
      ...(filters.role ? { role: filters.role as any } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.search?.trim()
        ? { phone: { contains: filters.search.trim() } }
        : {}),
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
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = toPrismaPagination(filters);

    const where: Record<string, unknown> = {
      ...(filters.verificationStatus
        ? { verificationStatus: filters.verificationStatus as any }
        : {}),
      ...(filters.search?.trim()
        ? {
            OR: [
              { fullName: { contains: filters.search.trim(), mode: 'insensitive' } },
              { user: { phone: { contains: filters.search.trim() } } },
            ],
          }
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
    // PERF-API-001: серверный поиск (admin StoresPage фильтровала клиентом
    // только загруженную страницу). name/slug insensitive, trgm-индексы есть.
    search?: string;
  }) {
    const { page, limit, skip } = toPrismaPagination(filters);

    const q = filters.search?.trim();
    const where = {
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { slug: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [stores, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, fullName: true, verificationStatus: true } },
          // ADMIN-STORES-NO-COUNTS-001 (подтверждён вживую 29.06.2026): admin
          // список показывал «—» в колонках ТОВАРЫ/ЗАКАЗЫ — endpoint не отдавал
          // counts. Фронт (StoresPage.tsx:238,246) уже читает _count.products/orders.
          // ADMIN-STORES-COUNT-SOFT-DELETED-001 (16.07.2026): admin force-delete
          // товара — это soft-delete (deletedAt), без фильтра счётчик показывал
          // удалённые товары («20» при пустом списке).
          _count: {
            select: {
              products: { where: { deletedAt: null } },
              orders: true,
            },
          },
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

  /** HYBRID-5: userId владельца магазина (через seller) для реконсиляции контекста. */
  async findStoreOwnerUserId(storeId: string): Promise<string | null> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { seller: { select: { userId: true } } },
    });
    return store?.seller?.userId ?? null;
  }

  /**
   * HYBRID-5: если активный контекст пользователя = SELLER — вернуть BUYER.
   * users.role — источник дефолт-контекста для бота/TMA (HYBRID-1); после
   * архивации магазина SELLER-дефолт указывает в никуда. updateMany с фильтром
   * по role — идемпотентно, BUYER/ADMIN не трогает.
   */
  async reconcileSellerContextToBuyer(userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, role: 'SELLER' },
      data: { role: 'BUYER' },
    });
  }

  async updateStoreStatus(id: string, status: string) {
    return this.prisma.store.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async approveAndPublishStore(id: string) {
    return this.prisma.store.update({
      where: { id },
      data: {
        status: 'APPROVED' as any,
        isPublic: true,
        publishedAt: new Date(),
      },
    });
  }

  async unapproveStore(id: string) {
    // API-STORE-DRAFT-REMOVAL-001: unapprove возвращает магазин в модерацию,
    // не в DRAFT. DRAFT в новой модели не используется — после отзыва одобрения
    // магазин должен попасть в очередь "На проверке" к админу повторно.
    return this.prisma.store.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW' as any,
        isPublic: false,
      },
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
