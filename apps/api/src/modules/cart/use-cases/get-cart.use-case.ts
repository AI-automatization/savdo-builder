import { Injectable } from '@nestjs/common';
import { CartRepository, CartWithItems } from '../repositories/cart.repository';

export interface GetCartInput {
  buyerId?: string;
  sessionKey?: string;
}

export interface EmptyCartResult {
  id: null;
  storeId: null;
  items: [];
}

@Injectable()
export class GetCartUseCase {
  constructor(private readonly cartRepo: CartRepository) {}

  async execute(input: GetCartInput): Promise<CartWithItems | EmptyCartResult> {
    let cart: CartWithItems | null = null;

    if (input.buyerId) {
      cart = await this.cartRepo.findByBuyerId(input.buyerId);
    } else if (input.sessionKey) {
      cart = await this.cartRepo.findBySessionKey(input.sessionKey);
    }

    if (!cart) {
      return { id: null, storeId: null, items: [] };
    }

    return cart;
  }
}
