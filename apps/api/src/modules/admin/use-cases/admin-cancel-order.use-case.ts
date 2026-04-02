import { Injectable, HttpStatus } from '@nestjs/common';
import { OrdersRepository } from '../../orders/repositories/orders.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// Terminal statuses — admin cannot change them
const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED']);

@Injectable()
export class AdminCancelOrderUseCase {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly adminRepo: AdminRepository,
  ) {}

  // INV-A01: AuditLog is mandatory for every admin action.
  // Admin may cancel any non-terminal order regardless of seller/buyer role rules.
  async execute(orderId: string, actorUserId: string, reason: string) {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new DomainException(ErrorCode.ORDER_NOT_FOUND, 'Order not found', HttpStatus.NOT_FOUND);
    }

    if (TERMINAL_STATUSES.has(order.status)) {
      throw new DomainException(
        ErrorCode.ORDER_INVALID_TRANSITION,
        `Cannot cancel order in terminal status ${order.status}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const oldStatus = order.status;

    const updated = await this.ordersRepo.updateStatus(orderId, {
      oldStatus,
      newStatus: 'CANCELLED',
      reason,
      changedByUserId: actorUserId,
    });

    // INV-A01
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: orderId,
      payload: { reason, adminId: actorUserId, previousStatus: oldStatus },
    });

    return updated;
  }
}
