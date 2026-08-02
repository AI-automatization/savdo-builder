import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { StoresRepository } from '../repositories/stores.repository';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface ChannelBindResult {
  telegramChannelId: string | null;
  telegramChannelTitle: string | null;
  autoPostProductsToChannel: boolean;
}

/**
 * Привязать/отвязать Telegram-канал из TMA (без бота).
 *
 * bind (channelId != null):
 *   - Нормализуем @username
 *   - Проверяем что бот является admin в канале (checkBotIsAdmin)
 *   - Обновляем store: telegramChannelId, telegramChannelTitle, autoPost=true
 *
 * unbind (channelId == null):
 *   - Очищаем channel-поля, autoPost=false
 */
@Injectable()
export class UpdateChannelBindingUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
    private readonly bot: TelegramBotService,
  ) {}

  async execute(userId: string, channelId: string | null): Promise<ChannelBindResult> {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    if (channelId === null) {
      await this.prisma.store.update({
        where: { id: store.id },
        data: { telegramChannelId: null, telegramChannelTitle: null, autoPostProductsToChannel: false },
      });
      return { telegramChannelId: null, telegramChannelTitle: null, autoPostProductsToChannel: false };
    }

    const normalizedId = channelId.trim().startsWith('@') ? channelId.trim() : `@${channelId.trim()}`;

    const isAdmin = await this.bot.checkBotIsAdmin(normalizedId);
    if (!isAdmin) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Бот не является администратором этого канала. Откройте канал → Администраторы → добавьте бота и попробуйте снова.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const channelTitle = await this.bot.getChannelTitle(normalizedId);

    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        telegramChannelId: normalizedId,
        telegramChannelTitle: channelTitle ?? normalizedId,
        autoPostProductsToChannel: true,
      },
    });

    return {
      telegramChannelId: normalizedId,
      telegramChannelTitle: channelTitle ?? normalizedId,
      autoPostProductsToChannel: true,
    };
  }
}
