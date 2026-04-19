import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CartRepository, CartWithItems } from '../repositories/cart.repository';
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

  constructor(private readonly cartRepo: CartRepository) {}

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

    await this.cartRepo.updateItemQuantity(input.itemId, input.quantity);

    const updated = await this.cartRepo.findById(item.cartId) as CartWithItems;
    return mapCart(updated);
  }
}
