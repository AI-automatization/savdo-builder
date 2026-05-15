/**
 * Тесты для `UpdateOrderStatusUseCase`.
 *
 * State machine — критично что только разрешённые transitions проходят
 * (docs/V1.1/02_state_machines.md). Покрываем:
 *   - все валидные transitions per role
 *   - запрещённые transitions
 *   - cross-store доступ блокируется
 *   - TG notifications: buyer всегда, seller — при PENDING_CANCELLED от buyer
 */
import { OrderStatus } from '@prisma/client';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrdersGateway } from '../../../socket/orders.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';

const ORDER_PENDING = {
  id: 'ord-1',
  orderNumber: 'ORD-001',
  status: OrderStatus.PENDING,
  storeId: 'store-1',
  totalAmount: 1000,
  currencyCode: 'UZS',
  store: {
    name: 'Test Store',
    seller: { telegramChatId: BigInt(111111), user: { languageCode: 'ru' } },
  },
  buyer: {
    user: { telegramId: BigInt(222222), languageCode: 'ru' },
  },
};

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let ordersRepo: { findById: jest.Mock; updateStatus: jest.Mock };
  let ordersGateway: {
    emitOrderStatusChanged: jest.Mock;
    emitOrderStatusChangedToBuyer: jest.Mock;
  };
  let tgNotifier: { notifyOrderStatusChanged: jest.Mock };

  beforeEach(() => {
    ordersRepo = {
      findById: jest.fn().mockResolvedValue(ORDER_PENDING),
      updateStatus: jest.fn().mockImplementation(async (_id, { newStatus }) => ({
        ...ORDER_PENDING,
        status: newStatus,
      })),
    };
    ordersGateway = {
      emitOrderStatusChanged: jest.fn(),
      emitOrderStatusChangedToBuyer: jest.fn().mockResolvedValue(undefined),
    };
    tgNotifier = { notifyOrderStatusChanged: jest.fn() };

    useCase = new UpdateOrderStatusUseCase(
      ordersRepo as unknown as OrdersRepository,
      ordersGateway as unknown as OrdersGateway,
      tgNotifier as unknown as SellerNotificationService,
    );
  });

  describe('order not found', () => {
    it('order не существует → ORDER_NOT_FOUND', async () => {
      ordersRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute({
        orderId: 'missing',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      })).rejects.toThrow(/Order not found/);
    });
  });

  describe('SELLER allowed transitions', () => {
    const sellerCases: Array<[OrderStatus, OrderStatus]> = [
      [OrderStatus.PENDING,    OrderStatus.CONFIRMED],
      [OrderStatus.CONFIRMED,  OrderStatus.PROCESSING],
      [OrderStatus.CONFIRMED,  OrderStatus.SHIPPED],
      [OrderStatus.PROCESSING, OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED,    OrderStatus.DELIVERED],
      [OrderStatus.CONFIRMED,  OrderStatus.CANCELLED],
      [OrderStatus.PENDING,    OrderStatus.CANCELLED],  // SELLER_ALSO_ALLOWED
    ];

    test.each(sellerCases)('SELLER может %s → %s', async (from, to) => {
      ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: from });
      const result = await useCase.execute({
        orderId: 'ord-1',
        newStatus: to,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
        storeId: 'store-1',
      });
      expect(result.status).toBe(to);
    });
  });

  describe('BUYER allowed transitions', () => {
    it('BUYER может PENDING → CANCELLED', async () => {
      const result = await useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CANCELLED,
        actorRole: 'BUYER',
        actorUserId: 'u-buyer',
      });
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('BUYER НЕ может PENDING → CONFIRMED (это для SELLER)', async () => {
      await expect(useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'BUYER',
        actorUserId: 'u-buyer',
      })).rejects.toThrow(/not permitted/);
    });

    it('BUYER НЕ может CONFIRMED → CANCELLED (это для SELLER)', async () => {
      ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: OrderStatus.CONFIRMED });
      await expect(useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CANCELLED,
        actorRole: 'BUYER',
        actorUserId: 'u-buyer',
      })).rejects.toThrow(/not permitted/);
    });
  });

  describe('forbidden transitions', () => {
    it('PENDING → SHIPPED (skip CONFIRMED) → ORDER_INVALID_TRANSITION', async () => {
      await expect(useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.SHIPPED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      })).rejects.toThrow(/not allowed/);
    });

    it('DELIVERED → анти-движение → ORDER_INVALID_TRANSITION', async () => {
      ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: OrderStatus.DELIVERED });
      await expect(useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.SHIPPED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      })).rejects.toThrow(/not allowed/);
    });

    it('CANCELLED → DELIVERED (re-life) → ORDER_INVALID_TRANSITION', async () => {
      ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: OrderStatus.CANCELLED });
      await expect(useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.DELIVERED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      })).rejects.toThrow(/not allowed/);
    });
  });

  describe('store ownership', () => {
    it('SELLER из чужого store → 403', async () => {
      await expect(useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
        storeId: 'store-OTHER',
      })).rejects.toThrow(/do not have access/);
    });

    it('SELLER без storeId → пропускается (трасттан JWT)', async () => {
      // Когда storeId не передан — проверка на ownership skipped (e.g. admin context)
      const result = await useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      });
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });
  });

  describe('side effects', () => {
    it('emitOrderStatusChanged вызван с (updatedOrder, oldStatus)', async () => {
      await useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      });
      expect(ordersGateway.emitOrderStatusChanged).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.CONFIRMED }),
        OrderStatus.PENDING,
      );
    });

    it('emitOrderStatusChangedToBuyer fire-and-forget — не блокирует если падает', async () => {
      ordersGateway.emitOrderStatusChangedToBuyer.mockRejectedValue(new Error('socket down'));
      // Не должно бросать
      await expect(useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      })).resolves.toBeDefined();
    });

    it('TG notification → buyer (всегда если есть telegramId)', async () => {
      await useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      });
      expect(tgNotifier.notifyOrderStatusChanged).toHaveBeenCalledWith(expect.objectContaining({
        recipientChatId: '222222',
        recipientRole: 'BUYER',
        orderNumber: 'ORD-001',
        oldStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.CONFIRMED,
      }));
    });

    it('buyer без telegramId → notification НЕ шлётся', async () => {
      ordersRepo.findById.mockResolvedValue({
        ...ORDER_PENDING,
        buyer: { user: { telegramId: null } },
      });
      await useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CONFIRMED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
      });
      expect(tgNotifier.notifyOrderStatusChanged).not.toHaveBeenCalled();
    });

    it('BUYER cancels PENDING → seller получает notification', async () => {
      await useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CANCELLED,
        actorRole: 'BUYER',
        actorUserId: 'u-buyer',
      });
      // 2 calls: buyer + seller
      expect(tgNotifier.notifyOrderStatusChanged).toHaveBeenCalledTimes(2);
      expect(tgNotifier.notifyOrderStatusChanged).toHaveBeenCalledWith(expect.objectContaining({
        recipientRole: 'SELLER',
        recipientChatId: '111111',
      }));
    });

    it('SELLER cancels — seller себе НЕ шлёт notification', async () => {
      ordersRepo.findById.mockResolvedValue({ ...ORDER_PENDING, status: OrderStatus.CONFIRMED });
      await useCase.execute({
        orderId: 'ord-1',
        newStatus: OrderStatus.CANCELLED,
        actorRole: 'SELLER',
        actorUserId: 'u-1',
        storeId: 'store-1',
      });
      // только buyer notification
      expect(tgNotifier.notifyOrderStatusChanged).toHaveBeenCalledTimes(1);
      expect(tgNotifier.notifyOrderStatusChanged).toHaveBeenCalledWith(expect.objectContaining({
        recipientRole: 'BUYER',
      }));
    });
  });
});
