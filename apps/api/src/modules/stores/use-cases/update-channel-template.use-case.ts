import { Injectable, HttpStatus } from '@nestjs/common';
import { StoresRepository } from '../repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { ChannelTemplateService } from '../../products/services/channel-template.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001: обновить шаблон + контакты для постинга в TG-канал.
 *
 * Семантика полей:
 *   - undefined → не трогать поле в БД (PATCH semantics)
 *   - "" (пустая строка) → очистить поле (записать NULL)
 *   - значение → записать как есть
 */

export interface UpdateChannelTemplateInput {
  channelPostTemplate?: string;
  channelContactPhone?: string;
  channelInstagramLink?: string;
  channelTiktokLink?: string;
}

@Injectable()
export class UpdateChannelTemplateUseCase {
  constructor(
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly templateService: ChannelTemplateService,
  ) {}

  async execute(userId: string, input: UpdateChannelTemplateInput) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }
    if (seller.isBlocked) {
      throw new DomainException(ErrorCode.SELLER_BLOCKED, 'Seller is blocked', HttpStatus.FORBIDDEN);
    }

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    // Soft-validate template: предупредим клиента о неподдерживаемых тегах.
    // Сами не блокируем — render всё равно их escape'нет, но UI должен показать
    // warning чтобы продавец знал что они уйдут как текст.
    if (input.channelPostTemplate) {
      const unsupported = this.templateService.findUnsupportedTags(input.channelPostTemplate);
      if (unsupported.length > 0) {
        // не throw — это soft-warning; контроллер может вернуть это в meta.
        // Запишем в патч как есть, продавец увидит как оно зарендерилось через preview.
      }
    }

    const patch = {
      ...(input.channelPostTemplate !== undefined && {
        channelPostTemplate: input.channelPostTemplate || null,
      }),
      ...(input.channelContactPhone !== undefined && {
        channelContactPhone: input.channelContactPhone || null,
      }),
      ...(input.channelInstagramLink !== undefined && {
        channelInstagramLink: input.channelInstagramLink || null,
      }),
      ...(input.channelTiktokLink !== undefined && {
        channelTiktokLink: input.channelTiktokLink || null,
      }),
    };

    return this.storesRepo.updateChannelTemplate(store.id, patch);
  }
}
