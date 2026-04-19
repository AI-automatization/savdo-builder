import { Injectable } from '@nestjs/common';
import { CartRepository, CartWithItems } from '../repositories/cart.repository';
import { MappedCart, mapCart, mapEmptyCart } from '../cart.mapper';

export interface GetCartInput {
  buyerId?: string;
  sessionKey?: string;
}

@Injectable()
export class GetCartUseCase {
  constructor(private readonly cartRepo: CartRepository) {}

  async execute(input: GetCartInput): Promise<MappedCart | ReturnType<typeof mapEmptyCart>> {
    let cart: CartWithItems | null = null;

    if (input.buyerId) {
      cart = await this.cartRepo.findByBuyerId(input.buyerId);
    } else if (input.sessionKey) {
      cart = await this.cartRepo.findBySessionKey(input.sessionKey);
    }

    if (!cart) {
      return mapEmptyCart();
    }

    return mapCart(cart);
  }
}
