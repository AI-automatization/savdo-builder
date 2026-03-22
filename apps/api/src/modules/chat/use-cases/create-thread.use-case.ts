import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThreadType } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository, ThreadWithMessages } from '../repositories/chat.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { OrdersRepository } from '../../orders/repositories/orders.repository';
import { StoresRepository } from '../../stores/repositories/stores.repository';

export interface CreateThreadInput {
  buyerId: string;
  contextType: string;
  contextId: string;
  firstMessage: string;
}

@Injectable()
export class CreateThreadUseCase {
  private readonly logger = new Logger(CreateThreadUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly ordersRepo: OrdersRepository,
    private readonly storesRepo: StoresRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(input: CreateThreadInput): Promise<ThreadWithMessages> {
    const chatEnabled = this.config.get<boolean>('features.chatEnabled');

    if (!chatEnabled) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Chat is currently disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const threadType = input.contextType as ThreadType;
    let sellerId: string;

    if (threadType === 'PRODUCT') {
      const product = await this.productsRepo.findById(input.contextId);

      if (!product) {
        throw new DomainException(
          ErrorCode.PRODUCT_NOT_FOUND,
          'Product not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const store = await this.storesRepo.findById(product.storeId);

      if (!store) {
        throw new DomainException(
          ErrorCode.STORE_NOT_FOUND,
          'Store not found',
          HttpStatus.NOT_FOUND,
        );
      }

      sellerId = store.sellerId;
    } else {
      const order = await this.ordersRepo.findById(input.contextId);

      if (!order) {
        throw new DomainException(
          ErrorCode.ORDER_NOT_FOUND,
          'Order not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (order.buyerId !== input.buyerId) {
        throw new DomainException(
          ErrorCode.ORDER_ACCESS_DENIED,
          'You do not own this order',
          HttpStatus.FORBIDDEN,
        );
      }

      sellerId = order.sellerId;
    }

    // Idempotency: return existing thread unchanged if already created
    const existing = await this.chatRepo.findThreadByContext(
      input.buyerId,
      threadType,
      input.contextId,
    );

    if (existing) {
      const thread = await this.chatRepo.findThreadById(existing.id);
      return thread!;
    }

    const thread = await this.chatRepo.createThread({
      buyerId: input.buyerId,
      sellerId,
      threadType,
      productId: threadType === 'PRODUCT' ? input.contextId : undefined,
      orderId: threadType === 'ORDER' ? input.contextId : undefined,
    });

    await this.chatRepo.addMessage({
      threadId: thread.id,
      senderUserId: input.buyerId,
      body: input.firstMessage,
    });

    this.logger.log(`Chat thread created: ${thread.id} by buyer ${input.buyerId}`);

    const result = await this.chatRepo.findThreadById(thread.id);
    return result!;
  }
}
