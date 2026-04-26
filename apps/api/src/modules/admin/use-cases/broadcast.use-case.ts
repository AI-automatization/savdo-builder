import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../../queues/queues.module';

export const TELEGRAM_JOB_BROADCAST = 'broadcast-message';

// Telegram rate limit: 30 messages/sec → 1 message per ~34ms
const BROADCAST_DELAY_MS = 34;

export type BroadcastAudience = 'all' | 'sellers' | 'buyers';

export interface BroadcastInput {
  message: string;
  previewMode?: boolean;
  adminUserId: string;
  audience?: BroadcastAudience;
}

export interface BroadcastResult {
  queued: number;
  previewMode: boolean;
  broadcastLogId?: string;
}

@Injectable()
export class BroadcastUseCase {
  private readonly logger = new Logger(BroadcastUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_TELEGRAM_NOTIFICATIONS) private readonly queue: Queue,
  ) {}

  async execute(input: BroadcastInput): Promise<BroadcastResult> {
    const audience = input.audience ?? 'all';
    const chatIds: string[] = [];
    const seen = new Set<string>();

    const add = (raw: bigint | null | undefined) => {
      if (!raw) return;
      const id = raw.toString();
      if (!seen.has(id)) { seen.add(id); chatIds.push(id); }
    };

    if (audience === 'sellers' || audience === 'all') {
      const sellers = await this.prisma.seller.findMany({
        where: {
          OR: [
            { telegramChatId: { not: null } },
            { user: { telegramId: { not: null } } },
          ],
        },
        select: {
          telegramChatId: true,
          user: { select: { telegramId: true } },
        },
      });
      for (const s of sellers) add(s.telegramChatId ?? s.user.telegramId);
    }

    if (audience === 'buyers' || audience === 'all') {
      const buyers = await this.prisma.buyer.findMany({
        where: { user: { telegramId: { not: null } } },
        select: { user: { select: { telegramId: true } } },
      });
      for (const b of buyers) add(b.user.telegramId);
    }

    if (input.previewMode) {
      return { queued: chatIds.length, previewMode: true };
    }

    const log = await this.prisma.broadcastLog.create({
      data: {
        message: input.message,
        createdBy: input.adminUserId,
      },
    });

    const jobs = chatIds.map((chatId, i) => ({
      name: TELEGRAM_JOB_BROADCAST,
      data: { chatId, message: input.message, broadcastLogId: log.id },
      opts: { delay: i * BROADCAST_DELAY_MS },
    }));

    await this.queue.addBulk(jobs);

    this.logger.log(`Broadcast queued: ${chatIds.length} messages, logId=${log.id}`);
    return { queued: chatIds.length, previewMode: false, broadcastLogId: log.id };
  }

  async getHistory() {
    return this.prisma.broadcastLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        message: true,
        sentCount: true,
        failedCount: true,
        createdAt: true,
        creator: { select: { phone: true } },
      },
    });
  }
}
