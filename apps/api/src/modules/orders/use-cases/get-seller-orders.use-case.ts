import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersRepository, PaginatedOrders } from '../repositories/orders.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface GetSellerOrdersInput {
  storeId: string;
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetSellerOrdersUseCase {
  private readonly logger = new Logger(GetSellerOrdersUseCase.name);

  constructor(private readonly ordersRepo: OrdersRepository) {}

  async execute(input: GetSellerOrdersInput) {
    if (!input.storeId) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const page = input.page ?? 1;
    const limit = Math.min(input.limit ?? 20, 100);

    const result = await this.ordersRepo.findByStoreId(input.storeId, {
      status: input.status,
      search: input.search,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      page,
      limit,
    });

    return {
      data: result.orders,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}
