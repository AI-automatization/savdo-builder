import { Injectable } from '@nestjs/common';
import { AdminNotificationsRepository } from '../repositories/admin-notifications.repository';

/**
 * ADMIN-NOTIFICATIONS-001
 *
 * Унифицированный вид уведомления для админ-панели. Источники гетерогенны
 * (ModerationCase, Order, Store), поэтому маппим их в общий контракт
 * { id, type, title, body, link, createdAt }.
 *
 * id = "<sourceType>:<entityId>" — стабилен между запросами, чтобы UI
 * мог пометить как «прочитанное» по этому ключу в localStorage.
 */
export type AdminNotificationType =
  | 'MODERATION_OPEN'
  | 'ORDER_PENDING'
  | 'STORE_PENDING_REVIEW';

export interface AdminNotificationDto {
  id: string;
  type: AdminNotificationType;
  title: string; // короткий маркер, локализуется на клиенте по `type`
  body: string;
  link: string;
  createdAt: string; // ISO
  entityId: string;
}

export interface AdminNotificationsResponse {
  events: AdminNotificationDto[];
  total: number;
  counts: {
    moderation: number;
    orders: number;
    stores: number;
  };
}

@Injectable()
export class GetAdminNotificationsUseCase {
  constructor(
    private readonly adminNotificationsRepo: AdminNotificationsRepository,
  ) {}

  async execute(limit = 20): Promise<AdminNotificationsResponse> {
    // Берём с запасом из каждого источника, потом мерджим и режем по limit.
    const perSource = Math.max(5, Math.ceil(limit));

    const [cases, orders, stores, counts] = await Promise.all([
      this.adminNotificationsRepo.findOpenModerationCases(perSource),
      this.adminNotificationsRepo.findPendingOrders(perSource),
      this.adminNotificationsRepo.findStoresPendingReview(perSource),
      this.adminNotificationsRepo.countOpenSources(),
    ]);

    const events: AdminNotificationDto[] = [
      ...cases.map<AdminNotificationDto>((c) => ({
        id: `moderation:${c.id}`,
        type: 'MODERATION_OPEN',
        title: `${c.caseType}`,
        body: c.reason ?? `${c.entityType}:${c.entityId}`,
        link: `/moderation/${c.id}`,
        createdAt: c.createdAt.toISOString(),
        entityId: c.id,
      })),
      ...orders.map<AdminNotificationDto>((o) => ({
        id: `order:${o.id}`,
        type: 'ORDER_PENDING',
        title: o.orderNumber,
        body: `${o.store?.name ?? ''} · ${o.customerFullName} · ${o.totalAmount.toString()} UZS`,
        link: `/orders`,
        createdAt: o.placedAt.toISOString(),
        entityId: o.id,
      })),
      ...stores.map<AdminNotificationDto>((s) => ({
        id: `store:${s.id}`,
        type: 'STORE_PENDING_REVIEW',
        title: s.name,
        body: s.seller?.fullName ?? s.slug,
        link: `/stores/${s.id}`,
        createdAt: s.createdAt.toISOString(),
        entityId: s.id,
      })),
    ];

    events.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return {
      events: events.slice(0, limit),
      total: counts.moderation + counts.orders + counts.stores,
      counts,
    };
  }
}
