import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CartRepository, CartWithItems } from '../repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { MappedCart, mapCart, toNum } from '../cart.mapper';

export interface AddToCartInput {
  productId: string;
  variantId?: string;
  quantity: number;
  buyerId?: string;
  sessionKey?: string;
}

@Injectable()
export class AddToCartUseCase {
  private readonly logger = new Logger(AddToCartUseCase.name);

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
  ) {}

  async execute(input: AddToCartInput): Promise<MappedCart> {
    // INV-C03: product must be ACTIVE
    const product = await this.productsRepo.findById(input.productId);
    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if ((product as any).status !== 'ACTIVE') {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_ACTIVE,
        'Product is not available',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let unitPriceSnapshot = toNum((product as any).basePrice);
    let salePriceSnapshot: number | undefined;
    // stockLimit is used later to validate the final cart quantity.
    let stockLimit: number = (product as any).totalStock as number;

    // INV-C03: for non-variant products check totalStock upfront.
    if (!input.variantId && stockLimit < input.quantity) {
      throw new DomainException(
        ErrorCode.INSUFFICIENT_STOCK,
        `Only ${stockLimit} items available`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // INV-C03: variant must be active and have sufficient stock
    if (input.variantId) {
      const variant = await this.variantsRepo.findById(input.variantId);
      if (!variant) {
        throw new DomainException(
          ErrorCode.VARIANT_NOT_FOUND,
          'Variant not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (!(variant as any).isActive) {
        throw new DomainException(
          ErrorCode.PRODUCT_NOT_ACTIVE,
          'Variant is not available',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      stockLimit = (variant as any).stockQuantity as number;
      if (stockLimit < input.quantity) {
        throw new DomainException(
          ErrorCode.INSUFFICIENT_STOCK,
          stockLimit === 0 ? 'Variant is out of stock' : `Only ${stockLimit} items available`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if ((variant as any).priceOverride != null) {
        unitPriceSnapshot = toNum((variant as any).priceOverride);
      }
      if ((variant as any).salePriceOverride != null) {
        salePriceSnapshot = toNum((variant as any).salePriceOverride);
      }
    }

    const productStoreId = (product as any).storeId as string;

    // Get or create cart
    const cart = await this.getOrCreateCart(input, productStoreId);

    // INV-C01: one store per cart
    if (cart.storeId !== productStoreId) {
      throw new DomainException(
        ErrorCode.CART_STORE_MISMATCH,
        'Cart already contains items from a different store. Clear the cart before adding items from another store.',
        HttpStatus.CONFLICT,
      );
    }

    // Check for duplicate item — increment if exists
    const variantId = input.variantId ?? null;
    const existingItem = await this.cartRepo.findItemByProductAndVariant(
      cart.id,
      input.productId,
      variantId,
    );

    if (existingItem) {
      const newQty = existingItem.quantity + input.quantity;
      if (newQty > stockLimit) {
        throw new DomainException(
          ErrorCode.INSUFFICIENT_STOCK,
          `Cannot add ${input.quantity} more: only ${stockLimit} in stock, ${existingItem.quantity} already in cart`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      await this.cartRepo.updateItemQuantity(existingItem.id, Math.min(newQty, 100));
    } else {
      await this.cartRepo.addItem(cart.id, {
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        unitPriceSnapshot,
        salePriceSnapshot,
      });
    }

    // Reload and return full mapped cart
    const updated = await this.cartRepo.findById(cart.id) as CartWithItems;
    return mapCart(updated);
  }

  private async getOrCreateCart(
    input: AddToCartInput,
    productStoreId: string,
  ): Promise<CartWithItems> {
    if (input.buyerId) {
      let cart = await this.cartRepo.findByBuyerId(input.buyerId);
      if (!cart) {
        const created = await this.cartRepo.createForBuyer(input.buyerId, productStoreId);
        cart = await this.cartRepo.findById(created.id) as CartWithItems;
      }
      return cart!;
    }

    if (input.sessionKey) {
      let cart = await this.cartRepo.findBySessionKey(input.sessionKey);
      if (!cart) {
        const created = await this.cartRepo.createForGuest(input.sessionKey, productStoreId);
        cart = await this.cartRepo.findById(created.id) as CartWithItems;
      }
      return cart!;
    }

    throw new DomainException(
      ErrorCode.UNAUTHORIZED,
      'Either buyerId or sessionKey is required',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
