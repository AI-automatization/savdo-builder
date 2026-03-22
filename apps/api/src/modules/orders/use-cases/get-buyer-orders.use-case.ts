import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersRepository, PaginatedOrders } from '../repositories/orders.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface GetBuyerOrdersInput {
  userId: string;
  buyerId: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetBuyerOrdersUseCase {
  private readonly logger = new Logger(GetBuyerOrdersUseCase.name);

  constructor(private readonly ordersRepo: OrdersRepository) {}

  async execute(input: GetBuyerOrdersInput): Promise<PaginatedOrders> {
    if (!input.buyerId) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.ordersRepo.findByBuyerId(input.buyerId, {
      status: input.status,
      page: input.page,
      limit: input.limit,
    });
  }
}
