import { DbBackupProcessor } from './db-backup.processor';
import { R2StorageService } from '../../modules/media/services/r2-storage.service';

function makeR2(keys: string[] = []) {
  return {
    isConfigured: jest.fn().mockReturnValue(true),
    getPrivateBucket: jest.fn().mockReturnValue('savdo-private'),
    uploadObject: jest.fn().mockResolvedValue(undefined),
    listObjects: jest.fn().mockResolvedValue(keys),
    deleteObject: jest.fn().mockResolvedValue(undefined),
  };
}

describe('DbBackupProcessor (BACKUP-001)', () => {
  const ENV = 'DB_BACKUP_ENABLED';
  const origEnabled = process.env[ENV];
  const origDbUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env[ENV] = origEnabled;
    process.env.DATABASE_URL = origDbUrl;
    jest.restoreAllMocks();
  });

  describe('selectExpiredKeys (retention)', () => {
    const key = (d: string) => `db-backups/savdo-${d}T22-00-00-000Z.dump`;

    it('меньше лимита — ничего не удаляем', () => {
      const keys = [key('2026-07-01'), key('2026-07-02')];
      expect(DbBackupProcessor.selectExpiredKeys(keys, 14)).toEqual([]);
    });

    it('больше лимита — удаляются САМЫЕ СТАРЫЕ, порядок входа не важен', () => {
      const keys = [key('2026-07-03'), key('2026-07-01'), key('2026-07-04'), key('2026-07-02')];
      expect(DbBackupProcessor.selectExpiredKeys(keys, 2)).toEqual([
        key('2026-07-02'),
        key('2026-07-01'),
      ]);
    });

    it('чужие ключи под префиксом не трогаем (не savdo-*.dump)', () => {
      const keys = [
        'db-backups/manual-pre-deploy.sql',
        key('2026-07-01'),
        key('2026-07-02'),
        key('2026-07-03'),
      ];
      expect(DbBackupProcessor.selectExpiredKeys(keys, 2)).toEqual([key('2026-07-01')]);
    });
  });

  describe('run (cron entrypoint)', () => {
    it('kill-switch выключен — ни дампа, ни обращений к R2', async () => {
      process.env[ENV] = 'false';
      const r2 = makeR2();
      const proc = new DbBackupProcessor(r2 as unknown as R2StorageService);
      const backupSpy = jest.spyOn(proc, 'runBackup');

      await proc.run();

      expect(backupSpy).not.toHaveBeenCalled();
      expect(r2.uploadObject).not.toHaveBeenCalled();
    });

    it('сбой бэкапа не пробрасывается из run (cron-runner живёт)', async () => {
      process.env[ENV] = 'true';
      const r2 = makeR2();
      r2.isConfigured.mockReturnValue(false);
      const proc = new DbBackupProcessor(r2 as unknown as R2StorageService);

      await expect(proc.run()).resolves.toBeUndefined();
      expect(r2.uploadObject).not.toHaveBeenCalled();
    });
  });

  describe('runBackup', () => {
    it('happy path: dump → upload в private bucket → prune старых', async () => {
      process.env.DATABASE_URL = 'postgresql://test';
      const existing = Array.from({ length: 16 }, (_, i) =>
        `db-backups/savdo-2026-07-${String(i + 1).padStart(2, '0')}T22-00-00-000Z.dump`,
      );
      const r2 = makeR2(existing);
      const proc = new DbBackupProcessor(r2 as unknown as R2StorageService);
      jest
        .spyOn(proc as unknown as { dumpDatabase: () => Promise<Buffer> }, 'dumpDatabase')
        .mockResolvedValue(Buffer.from('dump-bytes'));

      const now = new Date('2026-07-18T22:00:00.000Z');
      const res = await proc.runBackup(now);

      expect(r2.uploadObject).toHaveBeenCalledWith(
        'savdo-private',
        DbBackupProcessor.backupKey(now),
        expect.any(Buffer),
        'application/octet-stream',
      );
      // 16 существующих, retention 14 → 2 самых старых удалены.
      expect(res.deleted).toEqual([
        'db-backups/savdo-2026-07-02T22-00-00-000Z.dump',
        'db-backups/savdo-2026-07-01T22-00-00-000Z.dump',
      ]);
      expect(r2.deleteObject).toHaveBeenCalledTimes(2);
      expect(res.bytes).toBe(10);
    });

    it('нет DATABASE_URL — понятная ошибка до запуска pg_dump', async () => {
      delete process.env.DATABASE_URL;
      const proc = new DbBackupProcessor(makeR2() as unknown as R2StorageService);
      await expect(proc.runBackup(new Date())).rejects.toThrow(/DATABASE_URL/);
    });
  });
});
