import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository, ThreadWithMessages } from '../repositories/chat.repository';
import { OrdersRepository } from '../../orders/repositories/orders.repository';
import { SendMessageUseCase } from './send-message.use-case';

export interface CreateSellerThreadInput {
  sellerProfileId: string;
  orderId: string;
  firstMessage: string;
}

/**
 * FEAT-004: продавец инициирует чат с покупателем по заказу. До этого юзкейса
 * чат мог открыть только покупатель — продавец отвечал, но не мог первым
 * связаться (например, чтобы уточнить адрес или предупредить о задержке).
 *
 * Идемпотентно: если тред уже есть для пары (buyer, order) — возвращаем его
 * и просто добавляем новое сообщение от seller'а. Без сообщения не создаём
 * пустой тред — это спам-вектор. Сообщение проходит через SendMessageUseCase
 * чтобы получить socket-emit + push-уведомление покупателю в TG.
 */
@Injectable()
export class CreateSellerThreadUseCase {
  private readonly logger = new Logger(CreateSellerThreadUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly ordersRepo: OrdersRepository,
    private readonly sendMessage: SendMessageUseCase,
    private readonly config: ConfigService,
  ) {}

  async execute(input: CreateSellerThreadInput): Promise<ThreadWithMessages> {
    const chatEnabled = this.config.get<boolean>('features.chatEnabled');
    if (!chatEnabled) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Chat is currently disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const text = input.firstMessage?.trim();
    if (!text) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'firstMessage is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const order = await this.ordersRepo.findById(input.orderId);
    if (!order) {
      throw new DomainException(
        ErrorCode.ORDER_NOT_FOUND,
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (order.sellerId !== input.sellerProfileId) {
      throw new DomainException(
        ErrorCode.ORDER_ACCESS_DENIED,
        'You do not own this order',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!order.buyerId) {
      throw new DomainException(
        ErrorCode.BUYER_NOT_IDENTIFIED,
        'Order has no buyer (guest checkout) — cannot start chat',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const existing = await this.chatRepo.findThreadByContext(
      order.buyerId,
      'ORDER',
      input.orderId,
    );

    let threadId: string;
    if (existing) {
      threadId = existing.id;
    } else {
      const thread = await this.chatRepo.createThread({
        buyerId: order.buyerId,
        sellerId: input.sellerProfileId,
        threadType: 'ORDER',
        orderId: input.orderId,
      });
      threadId = thread.id;
      this.logger.log(`Seller-init chat thread created: ${thread.id} by seller ${input.sellerProfileId}`);
    }

    await this.sendMessage.execute({
      threadId,
      sellerProfileId: input.sellerProfileId,
      text,
    });

    const result = await this.chatRepo.findThreadById(threadId);
    return result!;
  }
}
