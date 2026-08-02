import { Module } from '@nestjs/common';
import { MediaModule } from '../../modules/media/media.module';
import { DbBackupProcessor } from './db-backup.processor';

/**
 * BACKUP-001: отдельный модуль (а не внутри Media/Admin), потому что бэкапы —
 * инфраструктурная забота без доменной принадлежности; MediaModule нужен
 * только ради R2StorageService. Cron подхватывается глобальным
 * ScheduleModule.forRoot() из app.module (прецедент — AccountDeletionModule +
 * PurgeDeletedUsersProcessor).
 */
@Module({
  imports: [MediaModule],
  providers: [DbBackupProcessor],
})
export class DbBackupModule {}
