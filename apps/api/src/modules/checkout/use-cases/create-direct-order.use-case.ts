import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Order, ProductStatus } from '@prisma/client';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { OrdersGateway } from '../../../socket/orders.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { CreateDirectOrderDto } from '../dto/create-direct-order.dto';
import { toNum } from '../../cart/cart.mapper';

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export interface CreateDirectOrderInput {
  buyerId: string;
  userId: string;
  dto: CreateDirectOrderDto;
}

@Injectable()
export class CreateDirectOrderUseCase {
  private readonly logger = new Logger(CreateDirectOrderUseCase.name);

  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
    private readonly checkoutRepo: CheckoutRepository,
    private readonly ordersGateway: OrdersGateway,
    private readonly tgNotifier: SellerNotificationService,
  ) {}

  async execute(input: CreateDirectOrderInput): Promise<Order> {
    const { dto } = input;

    if (!dto.items.length) {
      throw new DomainException(
        ErrorCode.CART_EMPTY,
        'Order must contain at least one item',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // API-N1-CHECKOUT-001: batch fetch — раньше Promise.all(map(findById))
    // на products + последовательный loop на variants = 2N round-trips.
    // Теперь 2 SELECT IN независимо от размера cart.
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const variantIds = [...new Set(dto.items.map((i) => i.variantId).filter((v): v is string => !!v))];
    const [productMap, variantMap] = await Promise.all([
      this.productsRepo.findManyByIds(productIds),
      variantIds.length > 0
        ? this.variantsRepo.findManyByIds(variantIds)
        : Promise.resolve(new Map()),
    ]);

    // Validate каждого продукта (in-memory).
    const products = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product || product.status !== ProductStatus.ACTIVE || product.deletedAt) {
        throw new DomainException(
          ErrorCode.PRODUCT_NOT_FOUND,
          `Product ${item.productId} is not available`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return product;
    });

    // All items must be from the same store (INV-C01)
    const storeIds = [...new Set(products.map((p) => p.storeId))];
    if (storeIds.length > 1) {
      throw new DomainException(
        ErrorCode.CART_STORE_MISMATCH,
        'All items must be from the same store',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const storeId = storeIds[0];

    // Validate variants и compute per-item prices (in-memory, no DB hits).
    const itemsMeta: Array<{ unitPrice: number; variantLabel?: string }> = [];

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      const product = products[i];
      let unitPrice = toNum(product.basePrice);
      let variantLabel: string | undefined;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);

        if (
          !variant ||
          variant.productId !== product.id ||
          !variant.isActive ||
          variant.deletedAt
        ) {
          throw new DomainException(
            ErrorCode.PRODUCT_NOT_FOUND,
            `Variant not found or not available`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        if (variant.stockQuantity < item.quantity) {
          throw new DomainException(
            ErrorCode.CHECKOUT_STOCK_INSUFFICIENT,
            `Insufficient stock for "${product.title}"`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        if (variant.priceOverride != null) {
          unitPrice = toNum(variant.priceOverride);
        }
        variantLabel = variant.titleOverride ?? undefined;
      }

      itemsMeta.push({ unitPrice, variantLabel });
    }

    // Resolve store → sellerId
    const store = await this.checkoutRepo.findStoreWithSeller(storeId);
    if (!store) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const subtotalAmount = dto.items.reduce(
      (sum, item, i) => sum + itemsMeta[i].unitPrice * item.quantity,
      0,
    );
    const deliveryFeeAmount = 0;
    const totalAmount = subtotalAmount + deliveryFeeAmount;

    const order = await this.checkoutRepo.createOrder({
      buyerId: input.buyerId,
      storeId,
      sellerId: store.sellerId,
      orderNumber: generateOrderNumber(),
      subtotalAmount,
      deliveryFeeAmount,
      totalAmount,
      currencyCode: 'UZS',
      customerFullName: dto.buyerName,
      customerPhone: dto.buyerPhone,
      customerComment: dto.buyerNote,
      addressLine1: dto.deliveryAddress,
      items: dto.items.map((item, i) => ({
        productId: item.productId,
        variantId: item.variantId,
        productTitleSnapshot: products[i].title,
        variantLabelSnapshot: itemsMeta[i].variantLabel,
        unitPriceSnapshot: itemsMeta[i].unitPrice,
        quantity: item.quantity,
        lineTotalAmount: itemsMeta[i].unitPrice * item.quantity,
      })),
    });

    this.logger.log(
      `Direct order ${order.orderNumber} created for buyer ${input.buyerId}`,
    );
    this.ordersGateway.emitOrderNew(order);

    // TG notification → seller
    this.tgNotifier.notifyNewOrder({
      sellerTelegramUsername: store.seller.telegramUsername,
      orderNumber: order.orderNumber,
      storeName: store.name,
      itemCount: dto.items.length,
      total: totalAmount,
      currency: 'UZS',
    });

    return order;
  }
}
