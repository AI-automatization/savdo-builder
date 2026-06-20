import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Cart, CartItem, CartStatus, Prisma } from '@prisma/client';

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
          salePrice: true,
          totalStock: true,
          status: true,
          isVisible: true,
          storeId: true,
          images: {
            where: { isPrimary: true },
            include: { media: true },
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
          salePriceOverride: true,
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
      where: { buyerId, status: CartStatus.ACTIVE },
      include: CART_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }) as Promise<CartWithItems | null>;
  }

  async findBySessionKey(sessionKey: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { sessionKey, status: CartStatus.ACTIVE },
      include: CART_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }) as Promise<CartWithItems | null>;
  }

  async findById(id: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { id, status: CartStatus.ACTIVE },
      include: CART_ITEMS_INCLUDE,
    }) as Promise<CartWithItems | null>;
  }

  async createForBuyer(buyerId: string, storeId: string): Promise<Cart> {
    return this.prisma.cart.create({
      data: {
        buyerId,
        storeId,
        status: CartStatus.ACTIVE,
      },
    });
  }

  async createForGuest(sessionKey: string, storeId: string): Promise<Cart> {
    return this.prisma.cart.create({
      data: {
        sessionKey,
        storeId,
        status: CartStatus.ACTIVE,
      },
    });
  }

  // CART-002: атомарный get-or-create через INSERT ... ON CONFLICT DO NOTHING.
  // Частичный уникальный индекс "carts_buyer_active_unique" гарантирует что
  // при параллельных запросах только один INSERT пройдёт, второй получит P2002
  // → мы fallback'аем на findFirst. Итог: всегда одна ACTIVE корзина на buyer.
  async getOrCreateForBuyer(buyerId: string, storeId: string): Promise<CartWithItems> {
    try {
      await this.prisma.cart.create({
        data: { buyerId, storeId, status: CartStatus.ACTIVE },
      });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
        throw e;
      }
      // P2002 = конкурентный запрос уже создал корзину — просто читаем её
    }
    const cart = await this.prisma.cart.findFirst({
      where: { buyerId, status: CartStatus.ACTIVE },
      include: CART_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return cart as CartWithItems;
  }

  // CART-002: аналогично для гостевых корзин (sessionKey).
  // Для гостей уникальный индекс не добавляли (sessionKey редко дублируется
  // и корзина не несёт финансовых последствий), но обёртка унифицирует вызов.
  async getOrCreateForGuest(sessionKey: string, storeId: string): Promise<CartWithItems> {
    let cart = await this.prisma.cart.findFirst({
      where: { sessionKey, status: CartStatus.ACTIVE },
      include: CART_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    if (!cart) {
      await this.prisma.cart.create({
        data: { sessionKey, storeId, status: CartStatus.ACTIVE },
      });
      cart = await this.prisma.cart.findFirst({
        where: { sessionKey, status: CartStatus.ACTIVE },
        include: CART_ITEMS_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    }
    return cart as CartWithItems;
  }

  // CART-001: upsertItem вместо отдельных find+insert/update.
  // Частичные уникальные индексы на cart_items позволяют ON CONFLICT:
  //   variantId не NULL → конфликт по (cartId, variantId) — @@unique уже есть в схеме
  //   variantId NULL    → конфликт по (cartId, productId) — новый индекс cart_items_no_variant_unique
  // Оба случая: quantity суммируется атомарно, нет TOCTOU между find и insert.
  async upsertItem(cartId: string, data: AddItemData, maxQty = 100): Promise<CartItem> {
    if (data.variantId) {
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO "cart_items" ("cartId", "productId", "variantId", "quantity", "unitPriceSnapshot", "salePriceSnapshot")
        VALUES (${cartId}::uuid, ${data.productId}::uuid, ${data.variantId}::uuid,
                ${data.quantity}, ${data.unitPriceSnapshot}, ${data.salePriceSnapshot ?? null})
        ON CONFLICT ("cartId", "variantId") WHERE "variantId" IS NOT NULL
        DO UPDATE SET
          "quantity" = LEAST("cart_items"."quantity" + EXCLUDED."quantity", ${maxQty}),
          "updatedAt" = now()
      `);
      return this.prisma.cartItem.findFirst({
        where: { cartId, variantId: data.variantId },
      }) as Promise<CartItem>;
    } else {
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO "cart_items" ("cartId", "productId", "variantId", "quantity", "unitPriceSnapshot", "salePriceSnapshot")
        VALUES (${cartId}::uuid, ${data.productId}::uuid, NULL,
                ${data.quantity}, ${data.unitPriceSnapshot}, ${data.salePriceSnapshot ?? null})
        ON CONFLICT ("cartId", "productId") WHERE "variantId" IS NULL
        DO UPDATE SET
          "quantity" = LEAST("cart_items"."quantity" + EXCLUDED."quantity", ${maxQty}),
          "updatedAt" = now()
      `);
      return this.prisma.cartItem.findFirst({
        where: { cartId, productId: data.productId, variantId: null },
      }) as Promise<CartItem>;
    }
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
      data: { status: CartStatus.MERGED },
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
        data: { status: CartStatus.MERGED },
      });
    });
  }
}
