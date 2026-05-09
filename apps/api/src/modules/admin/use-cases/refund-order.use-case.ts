import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

interface RefundInput {
  adminId: string;
  orderId: string;
  amount?: number;          // если не задан — refund на полную сумму
  reason: string;           // обязательно
  notes?: string;
  returnedToWallet?: boolean;
}

@Injectable()
export class RefundOrderUseCase {
  private readonly logger = new Logger(RefundOrderUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(input: RefundInput) {
    if (!input.reason?.trim()) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'reason is required', HttpStatus.BAD_REQUEST);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, totalAmount: true, status: true, paymentStatus: true },
    });
    if (!order) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Order not found', HttpStatus.NOT_FOUND);
    }

    // Возврат разрешён только для DELIVERED/SHIPPED/CONFIRMED — нельзя refund на CANCELLED/PENDING
    const refundable = ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PROCESSING'].includes(order.status);
    if (!refundable) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Cannot refund order in status ${order.status}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const orderTotal = Number(order.totalAmount);
    const refundAmount = input.amount ?? orderTotal;

    if (refundAmount <= 0 || refundAmount > orderTotal) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `amount must be > 0 and <= ${orderTotal}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Проверка: не было ли уже refund'ов на эту сумму
    const existingRefunds = await this.prisma.orderRefund.findMany({
      where: { orderId: input.orderId, status: 'completed' },
      select: { amount: true },
    });
    const alreadyRefunded = existingRefunds.reduce((s, r) => s + Number(r.amount), 0);
    const remaining = orderTotal - alreadyRefunded;
    if (refundAmount > remaining) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Already refunded ${alreadyRefunded} of ${orderTotal}. Remaining: ${remaining}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // TODO: при реальном payment gateway интегрироваться с Click/Payme reverse-transaction.
    // Сейчас — only ledger entry + статус заказа CANCELLED если refund на полную сумму.

    const isFullRefund = refundAmount + alreadyRefunded >= orderTotal;

    const result = await this.prisma.$transaction(async (tx) => {
      const refund = await tx.orderRefund.create({
        data: {
          orderId: input.orderId,
          adminId: input.adminId,
          amount: refundAmount,
          reason: input.reason.trim(),
          notes: input.notes?.trim() ?? null,
          returnedToWallet: Boolean(input.returnedToWallet),
          status: 'completed',
        },
      });

      if (isFullRefund) {
        await tx.order.update({
          where: { id: input.orderId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: `REFUND: ${input.reason.trim()}`,
            paymentStatus: 'REFUNDED' as any,
          },
        });
      }

      return refund;
    });

    this.logger.log(`REFUND: order=${input.orderId} amount=${refundAmount} by admin=${input.adminId}`);

    return {
      id: result.id,
      orderId: result.orderId,
      amount: Number(result.amount),
      reason: result.reason,
      isFullRefund,
      remainingAfter: remaining - refundAmount,
      createdAt: result.createdAt,
    };
  }
}
