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

    // INV-C03: variant must be active and in stock
    if (input.variantId) {
      const variant = await this.variantsRepo.findById(input.variantId);
      if (!variant) {
        throw new DomainException(
          ErrorCode.VARIANT_NOT_FOUND,
          'Variant not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (!(variant as any).isActive || (variant as any).stockQuantity <= 0) {
        throw new DomainException(
          ErrorCode.PRODUCT_NOT_ACTIVE,
          'Variant is not available or out of stock',
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
    let cart = await this.getOrCreateCart(input, productStoreId);

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
      const newQty = Math.min(existingItem.quantity + input.quantity, 100);
      await this.cartRepo.updateItemQuantity(existingItem.id, newQty);
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
