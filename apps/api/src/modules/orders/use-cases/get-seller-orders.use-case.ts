import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersRepository, PaginatedOrders } from '../repositories/orders.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface GetSellerOrdersInput {
  storeId: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetSellerOrdersUseCase {
  private readonly logger = new Logger(GetSellerOrdersUseCase.name);

  constructor(private readonly ordersRepo: OrdersRepository) {}

  async execute(input: GetSellerOrdersInput): Promise<PaginatedOrders> {
    if (!input.storeId) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.ordersRepo.findByStoreId(input.storeId, {
      status: input.status,
      page: input.page,
      limit: input.limit,
    });
  }
}
