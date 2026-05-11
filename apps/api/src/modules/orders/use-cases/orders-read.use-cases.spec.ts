/**
 * Объединённые тесты для read-only orders use-cases:
 *   - GetBuyerOrders: buyerId required (UNAUTHORIZED), pagination forwarding
 *   - GetSellerOrders: storeId required, limit cap 100, mapping (deliveryAddress,
 *     preview from firstItem, Number() для Decimal-полей)
 *   - GetOrderDetail: not found, NOT_ORDER_PARTICIPANT (cross-buyer/store защита)
 */
import { GetBuyerOrdersUseCase } from './get-buyer-orders.use-case';
import { GetSellerOrdersUseCase } from './get-seller-orders.use-case';
import { GetOrderDetailUseCase } from './get-order-detail.use-case';
import { OrdersRepository } from '../repositories/orders.repository';

describe('GetBuyerOrdersUseCase', () => {
  let useCase: GetBuyerOrdersUseCase;
  let repo: { findByBuyerId: jest.Mock };

  beforeEach(() => {
    repo = { findByBuyerId: jest.fn().mockResolvedValue({ orders: [], total: 0 }) };
    useCase = new GetBuyerOrdersUseCase(repo as unknown as OrdersRepository);
  });

  it('пустой buyerId → UNAUTHORIZED', async () => {
    await expect(useCase.execute({ userId: 'u-1', buyerId: '' as any }))
      .rejects.toThrow(/Buyer profile not found/);
  });

  it('happy: передаёт {status, page, limit} в repo', async () => {
    await useCase.execute({
      userId: 'u-1', buyerId: 'b-1', status: 'PENDING' as any, page: 2, limit: 10,
    });
    expect(repo.findByBuyerId).toHaveBeenCalledWith('b-1', {
      status: 'PENDING',
      page: 2,
      limit: 10,
    });
  });
});

describe('GetSellerOrdersUseCase', () => {
  let useCase: GetSellerOrdersUseCase;
  let repo: { findByStoreId: jest.Mock };

  beforeEach(() => {
    repo = { findByStoreId: jest.fn().mockResolvedValue({ orders: [], total: 0 }) };
    useCase = new GetSellerOrdersUseCase(repo as unknown as OrdersRepository);
  });

  it('пустой storeId → STORE_NOT_FOUND', async () => {
    await expect(useCase.execute({ storeId: '' as any })).rejects.toThrow(/Store not found/);
  });

  it('default page=1, limit=20', async () => {
    await useCase.execute({ storeId: 'store-1' });
    expect(repo.findByStoreId).toHaveBeenCalledWith('store-1', expect.objectContaining({
      page: 1, limit: 20,
    }));
  });

  it('limit cap 100 (max prevent abuse)', async () => {
    await useCase.execute({ storeId: 'store-1', limit: 9999 });
    expect(repo.findByStoreId).toHaveBeenCalledWith('store-1', expect.objectContaining({
      limit: 100,
    }));
  });

  it('mapping: Decimal → Number, deliveryAddress, preview', async () => {
    repo.findByStoreId.mockResolvedValue({
      orders: [{
        id: 'ord-1',
        orderNumber: 'ORD-X',
        status: 'PENDING',
        subtotalAmount: 100,
        discountAmount: 0,
        deliveryFeeAmount: 10,
        totalAmount: 110,
        city: 'Tashkent',
        region: 'Tashkent',
        addressLine1: 'Main St 1',
        addressLine2: null,
        buyer: { user: { phone: '+998900000001' } },
        items: [{
          productTitleSnapshot: 'iPhone',
          primaryImageUrlSnapshot: 'http://img/x',
        }],
        _count: { items: 3 },
      }],
      total: 1,
    });
    const result = await useCase.execute({ storeId: 'store-1' });
    expect(result.data[0]).toEqual(expect.objectContaining({
      id: 'ord-1',
      subtotalAmount: 100,
      deliveryFee: 10,
      totalAmount: 110,
      deliveryAddress: { street: 'Main St 1', city: 'Tashkent', region: 'Tashkent' },
      preview: {
        title: 'iPhone',
        imageUrl: 'http://img/x',
        itemCount: 3,
      },
      buyer: { phone: '+998900000001' },
    }));
  });

  it('order без city → deliveryAddress=undefined', async () => {
    repo.findByStoreId.mockResolvedValue({
      orders: [{
        id: 'ord-1', orderNumber: 'ORD-X', status: 'PENDING',
        subtotalAmount: 100, discountAmount: 0, deliveryFeeAmount: 0, totalAmount: 100,
        city: null, region: null, addressLine1: null, addressLine2: null,
        buyer: null, items: [], _count: { items: 0 },
      }],
      total: 1,
    });
    const result = await useCase.execute({ storeId: 'store-1' });
    expect(result.data[0].deliveryAddress).toBeUndefined();
    expect(result.data[0].preview).toBeNull();
    expect(result.data[0].buyer).toBeNull();
  });

  it('meta: total/page/limit/totalPages', async () => {
    repo.findByStoreId.mockResolvedValue({ orders: [], total: 47 });
    const result = await useCase.execute({ storeId: 'store-1', limit: 10 });
    expect(result.meta).toEqual({
      total: 47, page: 1, limit: 10, totalPages: 5, // ceil(47/10)
    });
  });
});

describe('GetOrderDetailUseCase', () => {
  let useCase: GetOrderDetailUseCase;
  let repo: { findById: jest.Mock };

  beforeEach(() => {
    repo = { findById: jest.fn() };
    useCase = new GetOrderDetailUseCase(repo as unknown as OrdersRepository);
  });

  it('order не найден → ORDER_NOT_FOUND', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute({ orderId: 'missing', buyerId: 'b-1' }))
      .rejects.toThrow(/Order not found/);
  });

  it('buyerId match → ok', async () => {
    repo.findById.mockResolvedValue({ id: 'ord-1', buyerId: 'b-1', storeId: 'store-1' });
    const result = await useCase.execute({ orderId: 'ord-1', buyerId: 'b-1' });
    expect(result.id).toBe('ord-1');
  });

  it('storeId match → ok (seller)', async () => {
    repo.findById.mockResolvedValue({ id: 'ord-1', buyerId: 'b-1', storeId: 'store-1' });
    const result = await useCase.execute({ orderId: 'ord-1', storeId: 'store-1' });
    expect(result.id).toBe('ord-1');
  });

  it('cross-buyer → NOT_ORDER_PARTICIPANT', async () => {
    repo.findById.mockResolvedValue({ id: 'ord-1', buyerId: 'b-1', storeId: 'store-1' });
    await expect(useCase.execute({ orderId: 'ord-1', buyerId: 'b-OTHER' }))
      .rejects.toThrow(/do not have access/);
  });

  it('cross-store → NOT_ORDER_PARTICIPANT', async () => {
    repo.findById.mockResolvedValue({ id: 'ord-1', buyerId: 'b-1', storeId: 'store-1' });
    await expect(useCase.execute({ orderId: 'ord-1', storeId: 'store-OTHER' }))
      .rejects.toThrow(/do not have access/);
  });

  it('ни buyerId ни storeId → NOT_ORDER_PARTICIPANT', async () => {
    repo.findById.mockResolvedValue({ id: 'ord-1', buyerId: 'b-1', storeId: 'store-1' });
    await expect(useCase.execute({ orderId: 'ord-1' }))
      .rejects.toThrow(/do not have access/);
  });
});
