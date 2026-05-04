import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrdersGateway } from '../../../socket/orders.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// Allowed transitions per role
// key: `${oldStatus}__${newStatus}`, value: who may perform it
type TransitionKey = `${OrderStatus}__${OrderStatus}`;
type ActorRole = 'SELLER' | 'BUYER';

const ALLOWED_TRANSITIONS: Partial<Record<TransitionKey, ActorRole>> = {
  'PENDING__CONFIRMED': 'SELLER',
  'CONFIRMED__PROCESSING': 'SELLER',
  'CONFIRMED__SHIPPED': 'SELLER',   // seller may skip PROCESSING for simple flows
  'PROCESSING__SHIPPED': 'SELLER',
  'SHIPPED__DELIVERED': 'SELLER',
  'PENDING__CANCELLED': 'BUYER',   // buyer cancels PENDING — overridden below for seller
  'CONFIRMED__CANCELLED': 'SELLER',
};

// Seller is also allowed to cancel PENDING orders
// We handle this by checking both tables for the specific pair
const SELLER_ALSO_ALLOWED: Set<TransitionKey> = new Set(['PENDING__CANCELLED']);

export interface UpdateOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
  reason?: string;
  actorRole: ActorRole;
  actorUserId: string;
  storeId?: string;
}

@Injectable()
export class UpdateOrderStatusUseCase {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly ordersGateway: OrdersGateway,
    private readonly tgNotifier: SellerNotificationService,
  ) {}

  async execute(input: UpdateOrderStatusInput): Promise<Order> {
    const order = await this.ordersRepo.findById(input.orderId);

    if (!order) {
      throw new DomainException(
        ErrorCode.ORDER_NOT_FOUND,
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const key: TransitionKey = `${order.status}__${input.newStatus}`;
    const allowedRole = ALLOWED_TRANSITIONS[key];

    if (!allowedRole) {
      throw new DomainException(
        ErrorCode.ORDER_INVALID_TRANSITION,
        `Transition from ${order.status} to ${input.newStatus} is not allowed`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Check whether the current actor's role is permitted for this transition.
    // SELLER may also perform PENDING→CANCELLED (normally assigned to BUYER in the table).
    const actorIsAllowed =
      allowedRole === input.actorRole ||
      (input.actorRole === 'SELLER' && SELLER_ALSO_ALLOWED.has(key));

    if (!actorIsAllowed) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        `Role ${input.actorRole} is not permitted to perform this status transition`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Sellers may only update orders belonging to their own store
    if (input.actorRole === 'SELLER' && input.storeId && order.storeId !== input.storeId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'You do not have access to this order',
        HttpStatus.FORBIDDEN,
      );
    }

    const oldStatus = order.status;

    const updatedOrder = await this.ordersRepo.updateStatus(input.orderId, {
      oldStatus,
      newStatus: input.newStatus,
      reason: input.reason,
      changedByUserId: input.actorUserId,
    });

    this.logger.log(
      `Order ${order.orderNumber} transitioned ${oldStatus} → ${input.newStatus} by ${input.actorRole} ${input.actorUserId}`,
    );

    this.ordersGateway.emitOrderStatusChanged(updatedOrder, oldStatus);
    // emitOrderStatusChangedToBuyer теперь async (резолв Buyer.userId). Не блокируем
    // основной flow — fire-and-forget с логом ошибки.
    void this.ordersGateway.emitOrderStatusChangedToBuyer(updatedOrder, oldStatus)
      .catch((err: unknown) => this.logger.warn(
        `emitOrderStatusChangedToBuyer failed: ${err instanceof Error ? err.message : String(err)}`,
      ));

    // TG notifications: buyer always (own order); seller only if cancelled by buyer
    const storeName = order.store?.name ?? '';
    const total = Number(updatedOrder.totalAmount);
    const currency = updatedOrder.currencyCode ?? 'UZS';

    // → Buyer (User.telegramId)
    const buyerChatId = order.buyer?.user.telegramId;
    if (buyerChatId) {
      this.tgNotifier.notifyOrderStatusChanged({
        recipientChatId: String(buyerChatId),
        recipientRole: 'BUYER',
        orderNumber: order.orderNumber,
        storeName,
        oldStatus,
        newStatus: input.newStatus,
        total,
        currency,
      });
    }

    // → Seller when buyer cancelled (PENDING__CANCELLED by BUYER)
    if (input.actorRole === 'BUYER' && input.newStatus === 'CANCELLED') {
      const sellerChatId = order.store?.seller.telegramChatId;
      if (sellerChatId) {
        this.tgNotifier.notifyOrderStatusChanged({
          recipientChatId: String(sellerChatId),
          recipientRole: 'SELLER',
          orderNumber: order.orderNumber,
          storeName,
          oldStatus,
          newStatus: input.newStatus,
          total,
          currency,
        });
      }
    }

    return updatedOrder;
  }
}
