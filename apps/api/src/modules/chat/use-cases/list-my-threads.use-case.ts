import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatThread } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

export interface ListMyThreadsInput {
  role: string;
  buyerId?: string;
  sellerId?: string;
}

@Injectable()
export class ListMyThreadsUseCase {
  private readonly logger = new Logger(ListMyThreadsUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(input: ListMyThreadsInput): Promise<ChatThread[]> {
    const chatEnabled = this.config.get<boolean>('features.chatEnabled');

    if (!chatEnabled) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Chat is currently disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (input.role === 'BUYER') {
      if (!input.buyerId) {
        throw new DomainException(
          ErrorCode.BUYER_NOT_IDENTIFIED,
          'Buyer profile not found',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      return this.chatRepo.findThreadsByBuyer(input.buyerId);
    }

    if (input.role === 'SELLER') {
      if (!input.sellerId) {
        throw new DomainException(
          ErrorCode.NOT_FOUND,
          'Seller profile not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return this.chatRepo.findThreadsBySeller(input.sellerId);
    }

    throw new DomainException(
      ErrorCode.FORBIDDEN,
      'Only buyers and sellers can list chat threads',
      HttpStatus.FORBIDDEN,
    );
  }
}
