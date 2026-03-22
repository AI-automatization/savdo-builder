import { Injectable } from '@nestjs/common';
import { Order, OrderItem, OrderStatus, OrderStatusHistory } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type OrderWithDetails = Order & {
  items: OrderItem[];
  history: OrderStatusHistory[];
};

export interface OrderListFilters {
  status?: OrderStatus;
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
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async findByStoreId(storeId: string, filters: OrderListFilters = {}): Promise<PaginatedOrders> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      storeId,
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip,
        take: limit,
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
