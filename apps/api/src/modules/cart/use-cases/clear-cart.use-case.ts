import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface ClearCartInput {
  buyerId?: string;
  sessionKey?: string;
}

@Injectable()
export class ClearCartUseCase {
  private readonly logger = new Logger(ClearCartUseCase.name);

  constructor(private readonly cartRepo: CartRepository) {}

  async execute(input: ClearCartInput): Promise<void> {
    let cart = null;

    if (input.buyerId) {
      cart = await this.cartRepo.findByBuyerId(input.buyerId);
    } else if (input.sessionKey) {
      cart = await this.cartRepo.findBySessionKey(input.sessionKey);
    }

    if (!cart) {
      // No cart to clear — no-op
      return;
    }

    await this.cartRepo.clearCart(cart.id);
  }
}
