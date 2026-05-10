import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { Order, OrderStatus, InventoryMovementType, DeliveryType, PaymentMethod, CartStatus } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface CheckoutOrderItemInput {
  productId: string;
  variantId?: string;
  productTitleSnapshot: string;
  variantLabelSnapshot?: string;
  skuSnapshot?: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotalAmount: number;
}

export interface CreateOrderData {
  buyerId: string;
  storeId: string;
  sellerId: string;
  cartId?: string;
  orderNumber: string;
  subtotalAmount: number;
  deliveryFeeAmount: number;
  totalAmount: number;
  currencyCode: string;
  customerFullName: string;
  customerPhone: string;
  customerComment?: string;
  city?: string;
  region?: string;
  addressLine1?: string;
  addressLine2?: string;
  items: CheckoutOrderItemInput[];
}

export interface BuyerWithUser {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  user: {
    phone: string;
    telegramId: bigint | null;
  };
}

export interface StoreWithSeller {
  id: string;
  sellerId: string;
  name: string;
  seller: {
    telegramUsername: string;
    telegramChatId: bigint | null;
    telegramNotificationsActive: boolean;
  };
}

@Injectable()
export class CheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBuyerWithUser(buyerId: string): Promise<BuyerWithUser | null> {
    return this.prisma.buyer.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        user: {
          select: { phone: true, telegramId: true },
        },
      },
    }) as Promise<BuyerWithUser | null>;
  }

  async findStoreWithSeller(storeId: string): Promise<StoreWithSeller | null> {
    // DB-AUDIT-001-07: фильтр soft-deleted магазинов
    return this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: {
        id: true,
        sellerId: true,
        name: true,
        seller: {
          select: {
            telegramUsername: true,
            telegramChatId: true,
            telegramNotificationsActive: true,
          },
        },
      },
    }) as Promise<StoreWithSeller | null>;
  }

  /**
   * Atomically:
   * 1. Creates Order + OrderItems
   * 2. Creates initial OrderStatusHistory entry (null → PENDING)
   * 3. For each item with variantId: decrements stockQuantity and creates InventoryMovement
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: data.orderNumber,
          buyerId: data.buyerId,
          storeId: data.storeId,
          sellerId: data.sellerId,
          cartId: data.cartId ?? null,
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.COD,
          deliveryType: DeliveryType.DELIVERY,
          currencyCode: data.currencyCode,
          subtotalAmount: data.subtotalAmount,
          deliveryFeeAmount: data.deliveryFeeAmount,
          totalAmount: data.totalAmount,
          customerFullName: data.customerFullName,
          customerPhone: data.customerPhone,
          customerComment: data.customerComment ?? null,
          city: data.city ?? null,
          region: data.region ?? null,
          addressLine1: data.addressLine1 ?? null,
        },
      });

      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          productTitleSnapshot: item.productTitleSnapshot,
          variantLabelSnapshot: item.variantLabelSnapshot ?? null,
          skuSnapshot: item.skuSnapshot ?? null,
          unitPriceSnapshot: item.unitPriceSnapshot,
          quantity: item.quantity,
          lineTotalAmount: item.lineTotalAmount,
        })),
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: null,
          newStatus: OrderStatus.PENDING,
        },
      });

      for (const item of data.items) {
        if (!item.variantId) continue;

        // API-STOCK-RACE-OVERSELL-001 (QA-AUDIT P0):
        // Старый decrement без guard позволял двум параллельным транзакциям
        // вычитать одинаковый stock → minus values, oversell. Atomic UPDATE
        // с WHERE stockQuantity >= qty: если 0 rows affected — недостаточно
        // в другой параллельной транзакции уже вычли.
        const affected = await tx.$executeRaw(Prisma.sql`
          UPDATE "product_variants"
          SET "stockQuantity" = "stockQuantity" - ${item.quantity}
          WHERE "id" = ${item.variantId}::uuid
            AND "stockQuantity" >= ${item.quantity}
        `);

        if (affected === 0) {
          throw new DomainException(
            ErrorCode.CHECKOUT_STOCK_INSUFFICIENT,
            `Insufficient stock for ${item.productTitleSnapshot}`,
            HttpStatus.UNPROCESSABLE_ENTITY,
            { productId: item.productId, variantId: item.variantId },
          );
        }

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            movementType: InventoryMovementType.ORDER_DEDUCTED,
            quantityDelta: -item.quantity,
            referenceType: 'order',
            referenceId: order.id,
            note: 'Order placed',
          },
        });
      }

      return order;
    });
  }

  async markCartConverted(cartId: string): Promise<void> {
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { status: CartStatus.CONVERTED },
    });
  }
}
