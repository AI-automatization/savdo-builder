import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ModerationCase, ModerationAction } from '@prisma/client';

@Injectable()
export class ModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Cases ───────────────────────────────────────────────────────────────

  async createCase(data: {
    entityType: string;
    entityId: string;
    caseType: string;
  }): Promise<ModerationCase> {
    return this.prisma.moderationCase.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        caseType: data.caseType,
        status: 'open',
      },
    });
  }

  async findCaseById(
    id: string,
  ): Promise<(ModerationCase & { actions: ModerationAction[] }) | null> {
    return this.prisma.moderationCase.findUnique({
      where: { id },
      include: { actions: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async findCaseByEntity(
    entityType: string,
    entityId: string,
  ): Promise<ModerationCase | null> {
    return this.prisma.moderationCase.findFirst({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingCases(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ cases: ModerationCase[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [cases, total] = await this.prisma.$transaction([
      this.prisma.moderationCase.findMany({
        where: { status: 'open' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationCase.count({ where: { status: 'open' } }),
    ]);

    return { cases, total };
  }

  async findAllCases(filters?: {
    status?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ cases: ModerationCase[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters?.status) where['status'] = filters.status;
    if (filters?.entityType) where['entityType'] = filters.entityType;

    const [cases, total] = await this.prisma.$transaction([
      this.prisma.moderationCase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationCase.count({ where }),
    ]);

    return { cases, total };
  }

  async updateCaseStatus(
    id: string,
    status: string,
    assignedAdminId?: string,
  ): Promise<ModerationCase> {
    return this.prisma.moderationCase.update({
      where: { id },
      data: {
        status,
        ...(assignedAdminId !== undefined ? { assignedAdminId } : {}),
      },
    });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  async addAction(data: {
    caseId: string;
    entityType: string;
    entityId: string;
    adminUserId: string;
    actionType: string;
    comment?: string;
  }): Promise<ModerationAction> {
    return this.prisma.moderationAction.create({
      data: {
        caseId: data.caseId,
        entityType: data.entityType,
        entityId: data.entityId,
        adminUserId: data.adminUserId,
        actionType: data.actionType,
        comment: data.comment,
      },
    });
  }

  // ─── AuditLog ─────────────────────────────────────────────────────────────

  async writeAuditLog(data: {
    actorUserId: string;
    actorType: string;
    entityType: string;
    entityId: string;
    action: string;
    payload?: object;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: data.actorUserId,
        actorType: data.actorType,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        payload: data.payload ?? {},
      },
    });
  }

  // ─── AdminUser lookup ─────────────────────────────────────────────────────

  async findAdminByUserId(userId: string) {
    return this.prisma.adminUser.findUnique({ where: { userId } });
  }
}
