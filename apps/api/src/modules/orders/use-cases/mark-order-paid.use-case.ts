import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Order } from '@prisma/client';
import { OrdersRepository } from '../repositories/orders.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface MarkOrderPaidInput {
  orderId: string;
  storeId: string;
  actorUserId: string;
}

/**
 * API-SELLER-MARK-PAID-001: продавец фиксирует факт получения оплаты
 * (наличными / переводом на карту, вне платежной системы).
 *
 * Переход UNPAID → PAID. REFUNDED → PAID запрещён (только через возвратный
 * flow). Только продавец-владелец заказа может вызывать.
 *
 * История: фиксируется через OrderStatusHistory с пометкой о платеже —
 * пока нет отдельной таблицы payment events. Если появится PaymentEvent —
 * мигрируем.
 */
@Injectable()
export class MarkOrderPaidUseCase {
  private readonly logger = new Logger(MarkOrderPaidUseCase.name);

  constructor(private readonly ordersRepo: OrdersRepository) {}

  async execute(input: MarkOrderPaidInput): Promise<Order> {
    const order = await this.ordersRepo.findById(input.orderId);

    if (!order) {
      throw new DomainException(
        ErrorCode.ORDER_NOT_FOUND,
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (order.storeId !== input.storeId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'You do not have access to this order',
        HttpStatus.FORBIDDEN,
      );
    }

    if (order.paymentStatus === 'PAID') {
      throw new DomainException(
        ErrorCode.ORDER_INVALID_TRANSITION,
        'Order is already marked as paid',
        HttpStatus.CONFLICT,
      );
    }

    if (order.paymentStatus !== 'UNPAID') {
      throw new DomainException(
        ErrorCode.ORDER_INVALID_TRANSITION,
        `Cannot mark order as paid from status ${order.paymentStatus}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const updated = await this.ordersRepo.markPaid(input.orderId, input.actorUserId);

    this.logger.log(
      `Order ${order.orderNumber} marked PAID by seller user=${input.actorUserId}`,
    );

    return updated;
  }
}
