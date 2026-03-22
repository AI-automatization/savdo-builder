import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Cart, CartItem } from '@prisma/client';

export type CartWithItems = Cart & { items: CartItem[] };

export interface AddItemData {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPriceSnapshot: number;
  salePriceSnapshot?: number;
}

const CART_ITEMS_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          basePrice: true,
          status: true,
          storeId: true,
          images: {
            where: { isPrimary: true },
            select: { mediaId: true },
            take: 1,
          },
        },
      },
      variant: {
        select: {
          id: true,
          sku: true,
          titleOverride: true,
          priceOverride: true,
          stockQuantity: true,
          isActive: true,
          optionValues: {
            include: {
              optionValue: {
                select: { value: true, code: true },
              },
            },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBuyerId(buyerId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { buyerId, status: 'active' },
      include: CART_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }) as Promise<CartWithItems | null>;
  }

  async findBySessionKey(sessionKey: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { sessionKey, status: 'active' },
      include: CART_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }) as Promise<CartWithItems | null>;
  }

  async findById(id: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { id, status: 'active' },
      include: CART_ITEMS_INCLUDE,
    }) as Promise<CartWithItems | null>;
  }

  async createForBuyer(buyerId: string, storeId: string): Promise<Cart> {
    return this.prisma.cart.create({
      data: {
        buyerId,
        storeId,
        status: 'active',
      },
    });
  }

  async createForGuest(sessionKey: string, storeId: string): Promise<Cart> {
    return this.prisma.cart.create({
      data: {
        sessionKey,
        storeId,
        status: 'active',
      },
    });
  }

  async addItem(cartId: string, data: AddItemData): Promise<CartItem> {
    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId: data.productId,
        variantId: data.variantId ?? null,
        quantity: data.quantity,
        unitPriceSnapshot: data.unitPriceSnapshot,
        salePriceSnapshot: data.salePriceSnapshot ?? null,
      },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: string): Promise<void> {
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  async setStoreId(cartId: string, storeId: string): Promise<Cart> {
    return this.prisma.cart.update({
      where: { id: cartId },
      data: { storeId },
    });
  }

  async findItemById(itemId: string): Promise<CartItem | null> {
    return this.prisma.cartItem.findFirst({ where: { id: itemId } });
  }

  async findItemByProductAndVariant(
    cartId: string,
    productId: string,
    variantId: string | null,
  ): Promise<CartItem | null> {
    return this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId ?? null,
      },
    });
  }

  async countItems(cartId: string): Promise<number> {
    return this.prisma.cartItem.count({ where: { cartId } });
  }

  async markCartMerged(cartId: string): Promise<void> {
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { status: 'merged' },
    });
  }

  async mergeGuestCart(guestCartId: string, buyerCartId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const guestItems = await tx.cartItem.findMany({
        where: { cartId: guestCartId },
      });

      for (const guestItem of guestItems) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: buyerCartId,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
          },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + guestItem.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: buyerCartId,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
              unitPriceSnapshot: guestItem.unitPriceSnapshot,
              salePriceSnapshot: guestItem.salePriceSnapshot,
            },
          });
        }
      }

      await tx.cart.update({
        where: { id: guestCartId },
        data: { status: 'merged' },
      });
    });
  }
}
