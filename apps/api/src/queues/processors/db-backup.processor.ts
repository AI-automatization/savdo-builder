import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { spawn } from 'child_process';
import { R2StorageService } from '../../modules/media/services/r2-storage.service';
import { ErrorReporter } from '../../shared/error-reporter';

/**
 * DbBackupProcessor — BACKUP-001.
 *
 * Ежедневный off-site бэкап прод-Postgres: pg_dump -Fc → R2 (private bucket,
 * префикс db-backups/). До этого единственной защитой данных был ручной pg_dump
 * перед деплоями (feedback_prod_data_safety).
 *
 * Расписание: '0 22 * * *' UTC = 03:00 Asia/Tashkent.
 *  - Ночь по Ташкенту — минимум трафика.
 *  - Не пересекается с другими суточными cron'ами (subscription-expiry 03:00 UTC,
 *    account-purge 03:15 UTC) — между ними и бэкапом 5+ часов.
 *
 * Подход: `@nestjs/schedule` `@Cron` — НЕ BullMQ repeatable. Зеркалит решение
 * PurgeDeletedUsersProcessor / SubscriptionExpiryProcessor (single Railway
 * инстанс, distributed-lock не нужен; см. queues.module.ts).
 *
 * Safety:
 *  - Kill-switch ENV DB_BACKUP_ENABLED — если не "true", cron логирует и выходит
 *    (локально/на превью не гоняем прод-дампы).
 *  - pg_dump читает БД, ничего не мутирует — сбой бэкапа не влияет на прод.
 *  - Таймаут 10 мин на pg_dump: зависший процесс убиваем, чтобы не копить
 *    зомби-подключения к Postgres.
 *  - Retention: храним последние 14 дампов, старые удаляем из R2. Имена
 *    date-sortable (ISO) → лексикографическая сортировка = хронологическая.
 *
 * Restore (ручной): скачать дамп из R2 → `pg_restore --clean --if-exists -d $DATABASE_URL file.dump`.
 *
 * Требование окружения: pg_dump в образе (Dockerfile runner: postgresql-client),
 * мажорная версия clientа ≥ серверной — иначе pg_dump откажется дампить.
 */
@Injectable()
export class DbBackupProcessor {
  private readonly logger = new Logger(DbBackupProcessor.name);

  /** BACKUP-001: ENV kill-switch — бэкап только там, где явно включён (прод). */
  private static readonly KILL_SWITCH_ENV = 'DB_BACKUP_ENABLED';

  /** Сколько последних дампов храним в R2. НЕ снижать без согласования. */
  static readonly RETENTION_COUNT = 14;

  /** Префикс ключей бэкапов в private-бакете. */
  static readonly KEY_PREFIX = 'db-backups/';

  /** Потолок на длительность pg_dump. */
  private static readonly DUMP_TIMEOUT_MS = 10 * 60 * 1000;

  constructor(private readonly r2Storage: R2StorageService) {}

  @Cron('0 22 * * *', {
    name: 'db-backup-daily',
    timeZone: 'UTC',
  })
  async run(): Promise<void> {
    const enabled = process.env[DbBackupProcessor.KILL_SWITCH_ENV] === 'true';
    if (!enabled) {
      this.logger.warn(
        `DbBackup DISABLED via ${DbBackupProcessor.KILL_SWITCH_ENV}!=true — skipping. ` +
          `Set ${DbBackupProcessor.KILL_SWITCH_ENV}=true in Railway env to enable.`,
      );
      return;
    }

    try {
      await this.runBackup(new Date());
    } catch (err) {
      // Не пробрасываем — сбой бэкапа не должен ломать cron-runner. Но это
      // ИНЦИДЕНТ (мы без свежего бэкапа) → Sentry обязательно.
      this.logger.error(
        `DbBackup FAILED: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      ErrorReporter.captureException(err, { op: 'dbBackup', source: 'cron-runner' });
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Public for testability — вызывается из @Cron выше.
  // ────────────────────────────────────────────────────────────────────────

  async runBackup(now: Date): Promise<{ key: string; bytes: number; deleted: string[] }> {
    if (!this.r2Storage.isConfigured()) {
      throw new Error('S3 storage is not configured — cannot store DB backup');
    }
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set — cannot run pg_dump');
    }

    const startedAt = Date.now();
    const dump = await this.dumpDatabase(databaseUrl);
    // -Fc формат уже сжат (zlib) — дополнительный gzip не нужен.
    const key = DbBackupProcessor.backupKey(now);
    const bucket = this.r2Storage.getPrivateBucket();
    await this.r2Storage.uploadObject(bucket, key, dump, 'application/octet-stream');

    // Retention: удаляем всё старше последних RETENTION_COUNT.
    const existing = await this.r2Storage.listObjects(bucket, DbBackupProcessor.KEY_PREFIX);
    const expired = DbBackupProcessor.selectExpiredKeys(existing, DbBackupProcessor.RETENTION_COUNT);
    for (const oldKey of expired) {
      await this.r2Storage.deleteObject(bucket, oldKey);
    }

    this.logger.log(
      `DbBackup done in ${Date.now() - startedAt}ms: ${key} (${dump.length} bytes), ` +
        `retained=${Math.min(existing.length, DbBackupProcessor.RETENTION_COUNT)}, pruned=${expired.length}`,
    );
    return { key, bytes: dump.length, deleted: expired };
  }

  /** Имя дампа: ISO-время с безопасными для S3-ключей символами. */
  static backupKey(now: Date): string {
    const stamp = now.toISOString().replace(/[:.]/g, '-');
    return `${DbBackupProcessor.KEY_PREFIX}savdo-${stamp}.dump`;
  }

  /**
   * Retention-логика (pure, покрыта тестами): сортируем по ключу по убыванию
   * (имена date-sortable), первые `keep` оставляем, остальные — на удаление.
   * Чужие ключи вне нашего нейминга (не savdo-*.dump) не трогаем.
   */
  static selectExpiredKeys(keys: string[], keep: number): string[] {
    const ours = keys.filter(
      (k) => k.startsWith(`${DbBackupProcessor.KEY_PREFIX}savdo-`) && k.endsWith('.dump'),
    );
    return ours.sort((a, b) => b.localeCompare(a)).slice(keep);
  }

  // ────────────────────────────────────────────────────────────────────────

  private dumpDatabase(databaseUrl: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // --no-owner/--no-privileges: restore в Railway/любую БД без ролей-владельцев.
      const child = spawn(
        'pg_dump',
        ['--format=custom', '--no-owner', '--no-privileges', '--dbname', databaseUrl],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );

      const out: Buffer[] = [];
      const errOut: Buffer[] = [];
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`pg_dump timed out after ${DbBackupProcessor.DUMP_TIMEOUT_MS}ms`));
      }, DbBackupProcessor.DUMP_TIMEOUT_MS);

      child.stdout.on('data', (chunk: Buffer) => out.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => errOut.push(chunk));
      // ENOENT — pg_dump отсутствует в образе (Dockerfile сломан/изменён).
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(Buffer.concat(out));
        } else {
          const stderr = Buffer.concat(errOut).toString('utf8').slice(0, 2000);
          reject(new Error(`pg_dump exited with code ${code}: ${stderr}`));
        }
      });
    });
  }
}
