import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../repositories/chat.repository';

export interface UnreadCountResult {
  total: number;             // суммарно по всем тредам
  threads: number;           // сколько тредов имеют unread > 0
}

/**
 * Возвращает количество непрочитанных сообщений для бейджа на иконке чата.
 * Используется в BottomNav (mobile) и Sidebar (desktop).
 *
 * Дешёвый запрос: одна выборка тредов + N count'ов через {@link ChatRepository.getUnreadCounts}.
 * Если профиль buyer/seller не создан — возвращаем 0 (не падаем).
 */
@Injectable()
export class GetUnreadCountUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(role: 'BUYER' | 'SELLER', buyerId: string | null | undefined, sellerId: string | null | undefined): Promise<UnreadCountResult> {
    const empty: UnreadCountResult = { total: 0, threads: 0 };

    if (role === 'BUYER') {
      if (!buyerId) return empty;
      const threads = await this.chatRepo.findThreadsByBuyer(buyerId);
      const counts = await this.chatRepo.getUnreadCounts(
        threads.map((t) => ({ id: t.id, buyerLastReadAt: t.buyerLastReadAt, sellerLastReadAt: t.sellerLastReadAt })),
        'buyer',
      );
      return this.summarise(counts);
    }

    if (role === 'SELLER') {
      if (!sellerId) return empty;
      const threads = await this.chatRepo.findThreadsBySeller(sellerId);
      const counts = await this.chatRepo.getUnreadCounts(
        threads.map((t) => ({ id: t.id, buyerLastReadAt: t.buyerLastReadAt, sellerLastReadAt: t.sellerLastReadAt })),
        'seller',
      );
      return this.summarise(counts);
    }

    return empty;
  }

  private summarise(counts: Map<string, number>): UnreadCountResult {
    let total = 0;
    let threads = 0;
    for (const c of counts.values()) {
      if (c > 0) { total += c; threads++; }
    }
    return { total, threads };
  }
}
