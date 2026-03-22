import { Injectable } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { ListAuditLogDto } from '../dto/list-audit-log.dto';

@Injectable()
export class GetAuditLogUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  async execute(dto: ListAuditLogDto) {
    return this.adminRepo.findAuditLogs({
      actorUserId: dto.actorUserId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
