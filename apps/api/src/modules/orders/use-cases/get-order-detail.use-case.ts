import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { OrdersRepository, OrderWithDetails } from '../repositories/orders.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface GetOrderDetailInput {
  orderId: string;
  // Exactly one of these must be provided depending on caller's role
  buyerId?: string;
  storeId?: string;
}

@Injectable()
export class GetOrderDetailUseCase {
  private readonly logger = new Logger(GetOrderDetailUseCase.name);

  constructor(private readonly ordersRepo: OrdersRepository) {}

  async execute(input: GetOrderDetailInput): Promise<OrderWithDetails> {
    const order = await this.ordersRepo.findById(input.orderId);

    if (!order) {
      throw new DomainException(
        ErrorCode.ORDER_NOT_FOUND,
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isBuyerMatch = input.buyerId !== undefined && order.buyerId === input.buyerId;
    const isStoreMatch = input.storeId !== undefined && order.storeId === input.storeId;

    if (!isBuyerMatch && !isStoreMatch) {
      throw new DomainException(
        ErrorCode.NOT_ORDER_PARTICIPANT,
        'You do not have access to this order',
        HttpStatus.FORBIDDEN,
      );
    }

    return order;
  }
}
