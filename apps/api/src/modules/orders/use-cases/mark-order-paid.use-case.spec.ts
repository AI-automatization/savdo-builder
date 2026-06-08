/**
 * Тесты для `MarkOrderPaidUseCase`.
 *
 * Покрываем:
 *   - happy path: UNPAID → PAID
 *   - cross-store доступ блокируется
 *   - повторный mark-paid (PAID) → 409
 *   - REFUNDED → 422
 *   - order not found → 404
 */
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { MarkOrderPaidUseCase } from './mark-order-paid.use-case';
import { OrdersRepository } from '../repositories/orders.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';

const baseOrder = {
  id: 'ord-1',
  orderNumber: 'ORD-001',
  status: OrderStatus.CONFIRMED,
  storeId: 'store-1',
  paymentStatus: PaymentStatus.UNPAID,
};

describe('MarkOrderPaidUseCase', () => {
  let useCase: MarkOrderPaidUseCase;
  let ordersRepo: { findById: jest.Mock; markPaid: jest.Mock };

  beforeEach(() => {
    ordersRepo = {
      findById: jest.fn().mockResolvedValue(baseOrder),
      markPaid: jest.fn().mockImplementation(async (id: string) => ({
        ...baseOrder,
        id,
        paymentStatus: PaymentStatus.PAID,
      })),
    };
    useCase = new MarkOrderPaidUseCase(ordersRepo as unknown as OrdersRepository);
  });

  it('UNPAID → PAID happy path', async () => {
    const res = await useCase.execute({
      orderId: 'ord-1',
      storeId: 'store-1',
      actorUserId: 'user-1',
    });
    expect(res.paymentStatus).toBe(PaymentStatus.PAID);
    expect(ordersRepo.markPaid).toHaveBeenCalledWith('ord-1', 'user-1');
  });

  it('404 when order does not exist', async () => {
    ordersRepo.findById.mockResolvedValueOnce(null);
    await expect(
      useCase.execute({ orderId: 'missing', storeId: 'store-1', actorUserId: 'u' }),
    ).rejects.toBeInstanceOf(DomainException);
    expect(ordersRepo.markPaid).not.toHaveBeenCalled();
  });

  it('403 when order belongs to another store', async () => {
    ordersRepo.findById.mockResolvedValueOnce({ ...baseOrder, storeId: 'other-store' });
    await expect(
      useCase.execute({ orderId: 'ord-1', storeId: 'store-1', actorUserId: 'u' }),
    ).rejects.toBeInstanceOf(DomainException);
    expect(ordersRepo.markPaid).not.toHaveBeenCalled();
  });

  it('409 when already PAID', async () => {
    ordersRepo.findById.mockResolvedValueOnce({ ...baseOrder, paymentStatus: PaymentStatus.PAID });
    await expect(
      useCase.execute({ orderId: 'ord-1', storeId: 'store-1', actorUserId: 'u' }),
    ).rejects.toBeInstanceOf(DomainException);
    expect(ordersRepo.markPaid).not.toHaveBeenCalled();
  });

  it('422 when REFUNDED', async () => {
    ordersRepo.findById.mockResolvedValueOnce({ ...baseOrder, paymentStatus: PaymentStatus.REFUNDED });
    await expect(
      useCase.execute({ orderId: 'ord-1', storeId: 'store-1', actorUserId: 'u' }),
    ).rejects.toBeInstanceOf(DomainException);
    expect(ordersRepo.markPaid).not.toHaveBeenCalled();
  });
});
