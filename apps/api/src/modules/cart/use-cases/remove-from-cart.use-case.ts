import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface RemoveFromCartInput {
  itemId: string;
  cartId: string;
}

@Injectable()
export class RemoveFromCartUseCase {
  private readonly logger = new Logger(RemoveFromCartUseCase.name);

  constructor(private readonly cartRepo: CartRepository) {}

  async execute(input: RemoveFromCartInput): Promise<void> {
    const item = await this.cartRepo.findItemById(input.itemId);

    if (!item) {
      throw new DomainException(
        ErrorCode.CART_ITEM_NOT_FOUND,
        'Cart item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify item belongs to this cart
    if (item.cartId !== input.cartId) {
      throw new DomainException(
        ErrorCode.CART_ITEM_NOT_FOUND,
        'Cart item does not belong to this cart',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cartRepo.removeItem(input.itemId);

    // If cart is now empty, no items remain — storeId stays as-is per schema constraint
    // (storeId is required on Cart). The cart remains scoped to the store
    // until either new items are added or the cart is cleared.
    const remaining = await this.cartRepo.countItems(input.cartId);
    if (remaining === 0) {
      // Cart is empty — update storeId to a sentinel or leave as-is.
      // Per schema storeId is required (non-nullable). We keep it for audit purposes.
      // CheckoutModule will reject empty carts. No storeId reset needed here.
    }
  }
}
