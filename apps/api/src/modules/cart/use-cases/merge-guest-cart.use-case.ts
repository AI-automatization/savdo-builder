import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface MergeGuestCartInput {
  sessionKey: string;
  buyerId: string;
}

@Injectable()
export class MergeGuestCartUseCase {
  private readonly logger = new Logger(MergeGuestCartUseCase.name);

  constructor(private readonly cartRepo: CartRepository) {}

  async execute(input: MergeGuestCartInput): Promise<void> {
    const guestCart = await this.cartRepo.findBySessionKey(input.sessionKey);

    // No guest cart or already empty — no-op
    if (!guestCart || guestCart.items.length === 0) {
      return;
    }

    // Get or create buyer cart
    let buyerCart = await this.cartRepo.findByBuyerId(input.buyerId);

    if (!buyerCart) {
      // Create buyer cart scoped to guest cart's store
      const created = await this.cartRepo.createForBuyer(input.buyerId, guestCart.storeId);
      buyerCart = await this.cartRepo.findById(created.id);
    }

    if (!buyerCart) {
      throw new DomainException(
        ErrorCode.CART_NOT_FOUND,
        'Failed to resolve buyer cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // INV-C01: If stores differ, clear buyer cart first — guest cart (most recent intent) wins
    if (buyerCart.storeId !== guestCart.storeId) {
      this.logger.log(
        `Store mismatch during cart merge: clearing buyer cart ${buyerCart.id} in favour of guest cart store ${guestCart.storeId}`,
      );
      await this.cartRepo.clearCart(buyerCart.id);
      await this.cartRepo.setStoreId(buyerCart.id, guestCart.storeId);
    }

    await this.cartRepo.mergeGuestCart(guestCart.id, buyerCart.id);
  }
}
