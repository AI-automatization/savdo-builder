/**
 * Объединённые тесты для create-thread use-cases:
 *   - CreateThread (PRODUCT/ORDER context, idempotent existing thread)
 *   - CreateSellerThread (FEAT-004: seller initiates chat по order)
 *
 * Особое внимание ownership:
 *   - PRODUCT context → seller resolved через product.storeId → store.sellerId
 *   - ORDER context → buyerId должен совпадать с order.buyerId (защита)
 *   - SellerThread → sellerId должен match order.sellerId
 */
import { ConfigService } from '@nestjs/config';
import { CreateThreadUseCase } from './create-thread.use-case';
import { CreateSellerThreadUseCase } from './create-seller-thread.use-case';
import { ChatRepository } from '../repositories/chat.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { OrdersRepository } from '../../orders/repositories/orders.repository';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { SendMessageUseCase } from './send-message.use-case';

describe('CreateThreadUseCase', () => {
  let useCase: CreateThreadUseCase;
  let chatRepo: {
    findThreadByContext: jest.Mock;
    findThreadById: jest.Mock;
    createThread: jest.Mock;
    addMessage: jest.Mock;
  };
  let productsRepo: { findById: jest.Mock };
  let ordersRepo: { findById: jest.Mock };
  let storesRepo: { findById: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    chatRepo = {
      findThreadByContext: jest.fn().mockResolvedValue(null),
      findThreadById: jest.fn().mockResolvedValue({ id: 't-1', messages: [] }),
      createThread: jest.fn().mockResolvedValue({ id: 't-1' }),
      addMessage: jest.fn().mockResolvedValue({ id: 'm-1' }),
    };
    productsRepo = { findById: jest.fn().mockResolvedValue({ id: 'p-1', storeId: 'store-1' }) };
    ordersRepo = { findById: jest.fn().mockResolvedValue({ id: 'ord-1', buyerId: 'buyer-1', sellerId: 'seller-1' }) };
    storesRepo = { findById: jest.fn().mockResolvedValue({ id: 'store-1', sellerId: 'seller-1' }) };
    config = { get: jest.fn().mockReturnValue(true) };
    useCase = new CreateThreadUseCase(
      chatRepo as unknown as ChatRepository,
      productsRepo as unknown as ProductsRepository,
      ordersRepo as unknown as OrdersRepository,
      storesRepo as unknown as StoresRepository,
      config as unknown as ConfigService,
    );
  });

  it('chatEnabled=false → SERVICE_UNAVAILABLE', async () => {
    config.get.mockReturnValue(false);
    await expect(useCase.execute({
      buyerId: 'buyer-1', contextType: 'PRODUCT', contextId: 'p-1', firstMessage: 'hi',
    })).rejects.toThrow(/disabled/);
  });

  describe('PRODUCT context', () => {
    it('product не найден → 404', async () => {
      productsRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute({
        buyerId: 'buyer-1', contextType: 'PRODUCT', contextId: 'p-missing', firstMessage: 'hi',
      })).rejects.toThrow(/Product not found/);
    });

    it('store не найден → 404', async () => {
      storesRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute({
        buyerId: 'buyer-1', contextType: 'PRODUCT', contextId: 'p-1', firstMessage: 'hi',
      })).rejects.toThrow(/Store not found/);
    });

    it('happy: создаёт thread + первое сообщение', async () => {
      await useCase.execute({
        buyerId: 'buyer-1', contextType: 'PRODUCT', contextId: 'p-1', firstMessage: 'price?',
      });
      expect(chatRepo.createThread).toHaveBeenCalledWith({
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        threadType: 'PRODUCT',
        productId: 'p-1',
        orderId: undefined,
      });
      expect(chatRepo.addMessage).toHaveBeenCalledWith({
        threadId: 't-1',
        senderUserId: 'buyer-1',
        body: 'price?',
      });
    });
  });

  describe('ORDER context', () => {
    it('order не найден → 404', async () => {
      ordersRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute({
        buyerId: 'buyer-1', contextType: 'ORDER', contextId: 'ord-missing', firstMessage: 'q',
      })).rejects.toThrow(/Order not found/);
    });

    it('order другого buyer → ORDER_ACCESS_DENIED', async () => {
      ordersRepo.findById.mockResolvedValue({ id: 'ord-1', buyerId: 'buyer-OTHER', sellerId: 's-1' });
      await expect(useCase.execute({
        buyerId: 'buyer-1', contextType: 'ORDER', contextId: 'ord-1', firstMessage: 'q',
      })).rejects.toThrow(/do not own this order/);
    });

    it('happy: thread с orderId', async () => {
      await useCase.execute({
        buyerId: 'buyer-1', contextType: 'ORDER', contextId: 'ord-1', firstMessage: 'q',
      });
      expect(chatRepo.createThread).toHaveBeenCalledWith({
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        threadType: 'ORDER',
        productId: undefined,
        orderId: 'ord-1',
      });
    });
  });

  describe('idempotency', () => {
    it('existing thread → НЕ создаём новый, возвращаем найденный', async () => {
      chatRepo.findThreadByContext.mockResolvedValue({ id: 't-existing' });
      const result = await useCase.execute({
        buyerId: 'buyer-1', contextType: 'PRODUCT', contextId: 'p-1', firstMessage: 'hi',
      });
      expect(chatRepo.createThread).not.toHaveBeenCalled();
      expect(chatRepo.addMessage).not.toHaveBeenCalled();
      expect(chatRepo.findThreadById).toHaveBeenCalledWith('t-existing');
      expect(result).toEqual({ id: 't-1', messages: [] });
    });
  });
});

describe('CreateSellerThreadUseCase', () => {
  let useCase: CreateSellerThreadUseCase;
  let chatRepo: {
    findThreadByContext: jest.Mock;
    findThreadById: jest.Mock;
    createThread: jest.Mock;
  };
  let ordersRepo: { findById: jest.Mock };
  let sendMessage: { execute: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    chatRepo = {
      findThreadByContext: jest.fn().mockResolvedValue(null),
      findThreadById: jest.fn().mockResolvedValue({ id: 't-1' }),
      createThread: jest.fn().mockResolvedValue({ id: 't-1' }),
    };
    ordersRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'ord-1', buyerId: 'buyer-1', sellerId: 'seller-1',
      }),
    };
    sendMessage = { execute: jest.fn().mockResolvedValue(undefined) };
    config = { get: jest.fn().mockReturnValue(true) };
    useCase = new CreateSellerThreadUseCase(
      chatRepo as unknown as ChatRepository,
      ordersRepo as unknown as OrdersRepository,
      sendMessage as unknown as SendMessageUseCase,
      config as unknown as ConfigService,
    );
  });

  it('chatEnabled=false → SERVICE_UNAVAILABLE', async () => {
    config.get.mockReturnValue(false);
    await expect(useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: 'hi',
    })).rejects.toThrow(/disabled/);
  });

  it('пустой firstMessage → VALIDATION_ERROR', async () => {
    await expect(useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: '',
    })).rejects.toThrow(/required/);
  });

  it('whitespace-only firstMessage → VALIDATION_ERROR', async () => {
    await expect(useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: '   ',
    })).rejects.toThrow(/required/);
  });

  it('order не найден → 404', async () => {
    ordersRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'missing', firstMessage: 'hi',
    })).rejects.toThrow(/Order not found/);
  });

  it('seller не владеет order → ORDER_ACCESS_DENIED', async () => {
    ordersRepo.findById.mockResolvedValue({
      id: 'ord-1', buyerId: 'buyer-1', sellerId: 'seller-OTHER',
    });
    await expect(useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: 'hi',
    })).rejects.toThrow(/do not own/);
  });

  it('order без buyerId (guest checkout) → BUYER_NOT_IDENTIFIED', async () => {
    ordersRepo.findById.mockResolvedValue({
      id: 'ord-1', buyerId: null, sellerId: 'seller-1',
    });
    await expect(useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: 'hi',
    })).rejects.toThrow(/guest checkout/);
  });

  it('happy: новый thread → createThread + sendMessage', async () => {
    await useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: 'about your order',
    });
    expect(chatRepo.createThread).toHaveBeenCalledWith({
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      threadType: 'ORDER',
      orderId: 'ord-1',
    });
    expect(sendMessage.execute).toHaveBeenCalledWith({
      threadId: 't-1',
      sellerProfileId: 'seller-1',
      text: 'about your order',
    });
  });

  it('idempotent: existing thread → reuse + добавляем message', async () => {
    chatRepo.findThreadByContext.mockResolvedValue({ id: 't-existing' });
    await useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: 'follow-up',
    });
    expect(chatRepo.createThread).not.toHaveBeenCalled();
    expect(sendMessage.execute).toHaveBeenCalledWith(expect.objectContaining({
      threadId: 't-existing',
      text: 'follow-up',
    }));
  });

  it('firstMessage trimmed', async () => {
    await useCase.execute({
      sellerProfileId: 'seller-1', orderId: 'ord-1', firstMessage: '  trimmed  ',
    });
    expect(sendMessage.execute).toHaveBeenCalledWith(expect.objectContaining({
      text: 'trimmed',
    }));
  });
});
