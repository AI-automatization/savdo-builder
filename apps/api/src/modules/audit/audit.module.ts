import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Общий модуль журналирования (FEAT-CATEGORY-JOURNAL-001).
 * PrismaModule глобальный, поэтому импортов не требует. Экспортит AuditService
 * для admin/categories и любых доменных модулей, которым нужен audit_log.
 */
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
