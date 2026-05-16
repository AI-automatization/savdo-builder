import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ChatThreadStatus } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

const ADMIN_ALLOWED_STATUSES: ChatThreadStatus[] = ['OPEN', 'CLOSED'];

export interface AdminListThreadsInput {
  page: number;
  limit: number;
  status?: string;
}

export interface AdminThreadListEntry {
  id: string;
  status: ChatThreadStatus;
  threadType: string;
  lastMessageAt: Date | null;
  storeName: string | null;
  storeSlug: string | null;
  buyerPhone: string | null;
  lastMessage: string | null;
}

export interface AdminListThreadsOutput {
  data: AdminThreadListEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminThreadDetailOutput {
  id: string;
  status: ChatThreadStatus;
  storeName: string | null;
  buyerPhone: string | null;
  messages: Array<{
    id: string;
    senderUserId: string;
    body: string | null;
    createdAt: Date;
  }>;
}

export interface AdminReportEntry {
  id: string;
  body: string;
  reportedAt: Date | null;
  createdAt: Date;
  threadId: string;
  threadStatus: ChatThreadStatus;
  buyerPhone: string | null;
  storeName: string | null;
}

/**
 * Admin-операции над чатами: список тредов, просмотр переписки,
 * удаление треда, очередь жалоб, снятие жалобы.
 */
@Injectable()
export class AdminChatUseCases {
  private readonly logger = new Logger(AdminChatUseCases.name);

  constructor(private readonly chatRepo: ChatRepository) {}

  async listThreads(input: AdminListThreadsInput): Promise<AdminListThreadsOutput> {
    const page = Number(input.page) || 1;
    const limit = Number(input.limit) || 30;
    const status =
      input.status && ADMIN_ALLOWED_STATUSES.includes(input.status as ChatThreadStatus)
        ? (input.status as ChatThreadStatus)
        : undefined;

    const [threads, total] = await this.chatRepo.findThreadsForAdmin({
      status,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: threads.map((t) => ({
        id: t.id,
        status: t.status,
        threadType: t.threadType,
        lastMessageAt: t.lastMessageAt,
        storeName: t.seller?.store?.name ?? null,
        storeSlug: t.seller?.store?.slug ?? null,
        buyerPhone: t.buyer?.user?.phone ?? null,
        lastMessage: t.messages[0]?.body ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  async getThreadMessages(threadId: string): Promise<AdminThreadDetailOutput> {
    const thread = await this.chatRepo.findThreadDetailForAdmin(threadId);

    if (!thread) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Thread not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      id: thread.id,
      status: thread.status,
      storeName: thread.seller?.store?.name ?? null,
      buyerPhone: thread.buyer?.user?.phone ?? null,
      messages: thread.messages.map((m) => ({
        id: m.id,
        senderUserId: m.senderUserId,
        body: m.body,
        createdAt: m.createdAt,
      })),
    };
  }

  async deleteThread(threadId: string): Promise<{ success: boolean }> {
    const thread = await this.chatRepo.findThreadParticipants(threadId);
    if (!thread) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Thread not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.chatRepo.hardDeleteThread(threadId);
    return { success: true };
  }

  async getReports(): Promise<AdminReportEntry[]> {
    const messages = await this.chatRepo.findReportedMessages();

    return messages.map((m) => ({
      id: m.id,
      body: m.body ?? '',
      reportedAt: m.reportedAt,
      createdAt: m.createdAt,
      threadId: m.thread.id,
      threadStatus: m.thread.status,
      buyerPhone: m.thread.buyer?.user?.phone ?? null,
      storeName: m.thread.seller?.store?.name ?? null,
    }));
  }

  async dismissReport(messageId: string): Promise<void> {
    await this.chatRepo.setMessageReportedAt(messageId, null);
    this.logger.log(`Report dismissed for message ${messageId}`);
  }
}
