import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface WriteAuditLogInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  actorType?: 'buyer' | 'seller' | 'admin' | 'system';
  payload?: object;
}

/**
 * Общий сервис записи audit_log (FEAT-CATEGORY-JOURNAL-001).
 * Вынесен из AdminRepository, чтобы доменные модули (categories и др.) могли
 * писать журнал БЕЗ зависимости от AdminModule (инверсия слоёв). PrismaModule
 * глобальный → достаточно провайдить/экспортить этот сервис через AuditModule.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(data: WriteAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: data.actorUserId,
        actorType: data.actorType ?? 'admin',
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        payload: data.payload ?? {},
      },
    });
  }
}
