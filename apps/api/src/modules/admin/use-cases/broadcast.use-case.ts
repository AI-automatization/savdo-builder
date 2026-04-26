import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../../queues/queues.module';

export const TELEGRAM_JOB_BROADCAST = 'broadcast-message';

// Telegram rate limit: 30 messages/sec → 1 message per ~34ms
const BROADCAST_DELAY_MS = 34;

export interface BroadcastInput {
  message: string;
  previewMode?: boolean;
  adminUserId: string;
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
    // Include sellers who linked via bot (telegramChatId) OR via TMA auth (user.telegramId).
    // Both fields hold the same numeric Telegram user ID — it equals the private chat ID
    // that the bot needs to message the user. Previously, only bot-linked sellers were
    // reachable; TMA-only sellers were silently skipped.
    const sellers = await this.prisma.seller.findMany({
      where: {
        OR: [
          { telegramChatId: { not: null } },
          { user: { telegramId: { not: null } } },
        ],
      },
      select: {
        id: true,
        telegramChatId: true,
        user: { select: { telegramId: true } },
      },
    });

    // Build deduplicated list of chat IDs
    const chatIds: string[] = [];
    const seen = new Set<string>();
    for (const s of sellers) {
      const raw = s.telegramChatId ?? s.user.telegramId;
      if (!raw) continue;
      const chatId = raw.toString();
      if (!seen.has(chatId)) {
        seen.add(chatId);
        chatIds.push(chatId);
      }
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
