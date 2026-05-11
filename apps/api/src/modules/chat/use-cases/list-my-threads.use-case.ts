import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

export interface ListMyThreadsInput {
  role: string;
  buyerId?: string;
  sellerId?: string;
}

export interface ThreadListItem {
  id: string;
  threadType: string;
  status: string;
  lastMessageAt: string | null;
  lastMessage: string | null;
  productId: string | null;
  productTitle: string | null;
  productImageUrl: string | null;
  productPrice: number | null;
  orderNumber: string | null;
  storeName: string | null;
  storeSlug: string | null;
  buyerPhone: string | null;
  unreadCount: number;
}

type BuyerThread = Awaited<ReturnType<ChatRepository['findThreadsByBuyer']>>[number];
type SellerThread = Awaited<ReturnType<ChatRepository['findThreadsBySeller']>>[number];
type ProductPreview = NonNullable<BuyerThread['product']>;

// API-CHAT-THREAD-PRODUCT-PREVIEW-001: pinned product context strip в TMA/web-buyer.
// Symmetric mapping для buyer + seller — одни и те же 4 поля, чтобы UI могла
// рендерить превью одинаково с обеих сторон без extra-query'ёв.
function resolveProductImageUrl(product: ProductPreview | null): string | null {
  const media = product?.images?.[0]?.media;
  if (!media?.objectKey) return null;
  // API-BUCKET-NAME-CONSISTENCY-001: telegram-expired = мёртвый file_id, отдаём null
  if (media.bucket === 'telegram-expired') return null;
  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
  if (media.bucket === 'telegram') return `${appUrl}/api/v1/media/proxy/${media.id}`;
  const storageUrl = process.env.STORAGE_PUBLIC_URL ?? '';
  if (storageUrl) return `${storageUrl}/${media.objectKey}`;
  return media.id && appUrl ? `${appUrl}/api/v1/media/proxy/${media.id}` : null;
}

function resolveProductPrice(product: ProductPreview | null): number | null {
  if (!product) return null;
  // sale price имеет приоритет, иначе basePrice (Prisma Decimal → Number)
  const raw = product.salePrice ?? product.basePrice;
  if (raw == null) return null;
  const n = Number(String(raw));
  return Number.isNaN(n) ? null : n;
}

function mapBuyerThread(t: BuyerThread, unreadCount: number): ThreadListItem {
  return {
    id: t.id,
    threadType: t.threadType,
    status: t.status,
    lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
    lastMessage: t.messages[0]?.body ?? null,
    productId: t.product?.id ?? null,
    productTitle: t.product?.title ?? null,
    productImageUrl: resolveProductImageUrl(t.product),
    productPrice: resolveProductPrice(t.product),
    orderNumber: t.order?.orderNumber ?? null,
    storeName: t.seller?.store?.name ?? null,
    storeSlug: t.seller?.store?.slug ?? null,
    buyerPhone: null,
    unreadCount,
  };
}

function mapSellerThread(t: SellerThread, unreadCount: number): ThreadListItem {
  return {
    id: t.id,
    threadType: t.threadType,
    status: t.status,
    lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
    lastMessage: t.messages[0]?.body ?? null,
    productId: t.product?.id ?? null,
    productTitle: t.product?.title ?? null,
    productImageUrl: resolveProductImageUrl(t.product),
    productPrice: resolveProductPrice(t.product),
    orderNumber: t.order?.orderNumber ?? null,
    storeName: null,
    storeSlug: null,
    buyerPhone: t.buyer?.user?.phone ?? null,
    unreadCount,
  };
}

@Injectable()
export class ListMyThreadsUseCase {
  private readonly logger = new Logger(ListMyThreadsUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(input: ListMyThreadsInput): Promise<ThreadListItem[]> {
    const chatEnabled = this.config.get<boolean>('features.chatEnabled');

    if (!chatEnabled) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Chat is currently disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (input.role === 'BUYER') {
      // Buyer profile создаётся лениво (при первом действии) — если ещё нет, чатов нет.
      if (!input.buyerId) return [];
      const threads = await this.chatRepo.findThreadsByBuyer(input.buyerId);
      const unreadMap = await this.chatRepo.getUnreadCounts(threads, 'buyer');
      return threads.map((t) => mapBuyerThread(t, unreadMap.get(t.id) ?? 0));
    }

    if (input.role === 'SELLER') {
      // Seller без профиля = магазин ещё не создан, чатов точно нет.
      if (!input.sellerId) return [];
      const threads = await this.chatRepo.findThreadsBySeller(input.sellerId);
      const unreadMap = await this.chatRepo.getUnreadCounts(threads, 'seller');
      return threads.map((t) => mapSellerThread(t, unreadMap.get(t.id) ?? 0));
    }

    // ADMIN or dual-role: merge buyer + seller threads, deduplicate, sort
    const [buyerThreads, sellerThreads] = await Promise.all([
      input.buyerId ? this.chatRepo.findThreadsByBuyer(input.buyerId) : Promise.resolve([]),
      input.sellerId ? this.chatRepo.findThreadsBySeller(input.sellerId) : Promise.resolve([]),
    ]);

    const [buyerUnreadMap, sellerUnreadMap] = await Promise.all([
      this.chatRepo.getUnreadCounts(buyerThreads, 'buyer'),
      this.chatRepo.getUnreadCounts(sellerThreads, 'seller'),
    ]);

    const seen = new Set<string>();
    const merged: ThreadListItem[] = [
      ...buyerThreads.map((t) => mapBuyerThread(t, buyerUnreadMap.get(t.id) ?? 0)),
      ...sellerThreads.map((t) => mapSellerThread(t, sellerUnreadMap.get(t.id) ?? 0)),
    ].filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    return merged.sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  }
}
