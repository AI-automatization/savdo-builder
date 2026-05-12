/**
 * Тесты для `AdminCancelOrderUseCase`.
 *
 * Финансово-критично: админ может отменить любой non-terminal заказ.
 * INV-A01: каждое admin-действие пишет audit log.
 */
import { AdminCancelOrderUseCase } from './admin-cancel-order.use-case';
import { OrdersRepository } from '../../orders/repositories/orders.repository';
import { AdminRepository } from '../repositories/admin.repository';

const ORDER_PENDING = { id: 'ord-1', orderNumber: 'ORD-001', status: 'PENDING' };
const ORDER_CANCELLED = { ...ORDER_PENDING, status: 'CANCELLED' };

describe('AdminCancelOrderUseCase', () => {
  let useCase: AdminCancelOrderUseCase;
  let ordersRepo: { findById: jest.Mock; updateStatus: jest.Mock };
  let adminRepo: { writeAuditLog: jest.Mock };

  beforeEach(() => {
    ordersRepo = {
      findById: jest.fn().mockResolvedValue(ORDER_PENDING),
      updateStatus: jest.fn().mockResolvedValue(ORDER_CANCELLED),
    };
    adminRepo = { writeAuditLog: jest.fn().mockResolvedValue(undefined) };
    useCase = new AdminCancelOrderUseCase(
      ordersRepo as unknown as OrdersRepository,
      adminRepo as unknown as AdminRepository,
    );
  });

  it('order не найден → 404', async () => {
    ordersRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', 'admin-1', 'fraud'))
      .rejects.toThrow(/Order not found/);
    expect(ordersRepo.updateStatus).not.toHaveBeenCalled();
  });

  describe('terminal statuses нельзя отменить', () => {
    it('DELIVERED → ORDER_INVALID_TRANSITION', async () => {
      ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: 'DELIVERED' });
      await expect(useCase.execute('ord-1', 'admin-1', 'mistake'))
        .rejects.toThrow(/terminal status DELIVERED/);
    });

    it('CANCELLED → ORDER_INVALID_TRANSITION (двойная отмена)', async () => {
      ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: 'CANCELLED' });
      await expect(useCase.execute('ord-1', 'admin-1', 'duplicate'))
        .rejects.toThrow(/terminal status CANCELLED/);
    });
  });

  describe('non-terminal — admin может отменить из любого статуса', () => {
    test.each(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'])(
      '%s → CANCELLED + audit',
      async (status) => {
        ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status });
        const result = await useCase.execute('ord-1', 'admin-1', 'admin override');
        expect(result.status).toBe('CANCELLED');
        expect(ordersRepo.updateStatus).toHaveBeenCalledWith('ord-1', expect.objectContaining({
          oldStatus: status,
          newStatus: 'CANCELLED',
          reason: 'admin override',
          changedByUserId: 'admin-1',
        }));
      },
    );
  });

  it('audit log включает previousStatus', async () => {
    ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: 'CONFIRMED' });
    await useCase.execute('ord-1', 'admin-1', 'fraud');
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
      actorUserId: 'admin-1',
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: 'ord-1',
      payload: { reason: 'fraud', adminId: 'admin-1', previousStatus: 'CONFIRMED' },
    });
  });

  it('updateStatus → audit log порядок', async () => {
    const calls: string[] = [];
    ordersRepo.updateStatus.mockImplementation(async () => { calls.push('update'); return ORDER_CANCELLED; });
    adminRepo.writeAuditLog.mockImplementation(async () => { calls.push('audit'); });
    await useCase.execute('ord-1', 'admin-1', 'fraud');
    expect(calls).toEqual(['update', 'audit']);
  });
});
