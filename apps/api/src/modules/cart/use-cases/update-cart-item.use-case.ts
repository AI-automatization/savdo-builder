import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CartRepository, CartWithItems } from '../repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { MappedCart, mapCart } from '../cart.mapper';

export interface UpdateCartItemInput {
  itemId: string;
  cartId: string;
  quantity: number;
}

@Injectable()
export class UpdateCartItemUseCase {
  private readonly logger = new Logger(UpdateCartItemUseCase.name);

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
  ) {}

  async execute(input: UpdateCartItemInput): Promise<MappedCart> {
    const item = await this.cartRepo.findItemById(input.itemId);

    if (!item) {
      throw new DomainException(
        ErrorCode.CART_ITEM_NOT_FOUND,
        'Cart item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (item.cartId !== input.cartId) {
      throw new DomainException(
        ErrorCode.CART_ITEM_NOT_FOUND,
        'Cart item does not belong to this cart',
        HttpStatus.NOT_FOUND,
      );
    }

    if (input.quantity < 1) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Quantity must be at least 1',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Stock validation before applying the new quantity.
    if (item.variantId) {
      const variant = await this.variantsRepo.findById(item.variantId);
      if (variant && (variant as any).stockQuantity < input.quantity) {
        throw new DomainException(
          ErrorCode.INSUFFICIENT_STOCK,
          `Only ${(variant as any).stockQuantity} items available`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    } else {
      const product = await this.productsRepo.findById(item.productId);
      if (product && (product as any).totalStock < input.quantity) {
        throw new DomainException(
          ErrorCode.INSUFFICIENT_STOCK,
          `Only ${(product as any).totalStock} items available`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    // CART-003: передаём item.quantity как expectedQuantity для оптимистичного lock.
    // Если параллельный запрос изменил item между нашим findItemById и этим update — null.
    const updated_ = await this.cartRepo.updateItemQuantity(
      input.itemId,
      input.quantity,
      item.quantity,
    );
    if (updated_ === null) {
      throw new DomainException(
        ErrorCode.CONFLICT,
        'Cart item was modified concurrently. Please retry.',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.cartRepo.findById(item.cartId) as CartWithItems;
    return mapCart(updated);
  }
}
