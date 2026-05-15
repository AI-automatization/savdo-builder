import { Injectable } from '@nestjs/common';
import { Order, OrderItem, OrderStatus, OrderStatusHistory, Buyer, User, Store, Seller, InventoryMovementType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type OrderWithDetails = Order & {
  items: OrderItem[];
  history: OrderStatusHistory[];
  buyer: (Buyer & { user: Pick<User, 'phone' | 'telegramId' | 'languageCode'> }) | null;
  store:
    | (Pick<Store, 'name' | 'telegramContactLink'> & {
        seller: Pick<Seller, 'telegramUsername' | 'telegramChatId' | 'telegramNotificationsActive'> & {
          user: Pick<User, 'languageCode'>;
        };
      })
    | null;
};

export interface OrderListFilters {
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBuyerId(buyerId: string, filters: OrderListFilters = {}): Promise<PaginatedOrders> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      buyerId,
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: { take: 1, orderBy: { createdAt: 'asc' }, select: { productTitleSnapshot: true, primaryImageUrlSnapshot: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async findByStoreId(storeId: string, filters: OrderListFilters = {}): Promise<PaginatedOrders> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      storeId,
      ...(filters.status ? { status: filters.status } : {}),
    };

    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: s, mode: 'insensitive' } },
        { customerFullName: { contains: s, mode: 'insensitive' } },
        { customerPhone: { contains: s, mode: 'insensitive' } },
        { city: { contains: s, mode: 'insensitive' } },
        { addressLine1: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.placedAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo   ? { lte: new Date(filters.dateTo)   } : {}),
      };
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip,
        take: limit,
        include: {
          buyer: {
            include: { user: { select: { phone: true } } },
          },
          items: {
            take: 1,
            orderBy: { createdAt: 'asc' as const },
            select: {
              productTitleSnapshot: true,
              primaryImageUrlSnapshot: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async findById(id: string): Promise<OrderWithDetails | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        history: {
          orderBy: { createdAt: 'asc' },
        },
        buyer: {
          include: {
            user: { select: { phone: true, telegramId: true, languageCode: true } },
          },
        },
        store: {
          select: {
            name: true,
            telegramContactLink: true,
            seller: {
              select: {
                telegramUsername: true,
                telegramChatId: true,
                telegramNotificationsActive: true,
                user: { select: { languageCode: true } },
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    data: { newStatus: OrderStatus; oldStatus: OrderStatus; reason?: string; changedByUserId?: string },
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: data.newStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          oldStatus: data.oldStatus,
          newStatus: data.newStatus,
          changedByUserId: data.changedByUserId ?? null,
          comment: data.reason ?? null,
        },
      });

      // INV-O04 (CLAUDE.md): stock возвращается при отмене.
      // Применяется только при переходе из активного статуса (PENDING/CONFIRMED/
      // PROCESSING) → CANCELLED. SHIPPED/DELIVERED → CANCELLED обычно
      // невозможен по state machine; если разрешат refund для DELIVERED — это
      // отдельный flow в RefundOrderUseCase.
      const ACTIVE_STATUSES: OrderStatus[] = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
      ];
      if (
        data.newStatus === OrderStatus.CANCELLED &&
        ACTIVE_STATUSES.includes(data.oldStatus)
      ) {
        const items = await tx.orderItem.findMany({
          where: { orderId: id, variantId: { not: null }, productId: { not: null } },
          select: { productId: true, variantId: true, quantity: true },
        });
        for (const item of items) {
          // Guard: productId nullable в OrderItem (SetNull при удалении).
          // findMany уже фильтрует, but TS narrowing нужен.
          if (!item.variantId || !item.productId) continue;
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              movementType: InventoryMovementType.ORDER_RELEASED,
              quantityDelta: item.quantity,
              referenceType: 'order',
              referenceId: id,
              note: data.reason ? `Order cancelled: ${data.reason}` : 'Order cancelled',
            },
          });
        }
      }

      return order;
    });
  }

  async addStatusHistory(
    orderId: string,
    data: { oldStatus: OrderStatus | null; newStatus: OrderStatus; reason?: string; changedByUserId?: string },
  ): Promise<OrderStatusHistory> {
    return this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        oldStatus: data.oldStatus ?? null,
        newStatus: data.newStatus,
        changedByUserId: data.changedByUserId ?? null,
        comment: data.reason ?? null,
      },
    });
  }
}
