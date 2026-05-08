/**
 * Тесты для `MigrateTgMediaToR2UseCase`.
 * Идемпотентность критична — повторный запуск не должен ломать данные.
 */
import { MigrateTgMediaToR2UseCase } from './migrate-tg-media-to-r2.use-case';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramStorageService } from '../../media/services/telegram-storage.service';
import { R2StorageService } from '../../media/services/r2-storage.service';

jest.mock('axios');
import axios from 'axios';

describe('MigrateTgMediaToR2UseCase', () => {
  let useCase: MigrateTgMediaToR2UseCase;
  let prisma: { mediaFile: { findMany: jest.Mock; update: jest.Mock } };
  let tgStorage: jest.Mocked<TelegramStorageService>;
  let r2Storage: jest.Mocked<R2StorageService>;

  beforeEach(() => {
    prisma = {
      mediaFile: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    tgStorage = {
      isConfigured: jest.fn().mockReturnValue(true),
      getFileUrl: jest.fn(),
    } as unknown as jest.Mocked<TelegramStorageService>;
    r2Storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      getDefaultBucket: jest.fn().mockReturnValue('savdo-public'),
      uploadObject: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<R2StorageService>;
    useCase = new MigrateTgMediaToR2UseCase(
      prisma as unknown as PrismaService,
      tgStorage,
      r2Storage,
    );
    (axios.get as jest.Mock).mockReset();
  });

  describe('precondition checks', () => {
    it('БРОСАЕТ если R2 не сконфигурирован', async () => {
      r2Storage.isConfigured.mockReturnValue(false);
      await expect(useCase.execute()).rejects.toThrow(/R2\/Supabase Storage не сконфигурирован/);
    });

    it('БРОСАЕТ если TG storage не сконфигурирован', async () => {
      tgStorage.isConfigured.mockReturnValue(false);
      await expect(useCase.execute()).rejects.toThrow(/Telegram storage не сконфигурирован/);
    });
  });

  describe('limit clamping', () => {
    it('default limit = 50', async () => {
      await useCase.execute();
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('clamp upper bound 200', async () => {
      await useCase.execute(500);
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });

    it('clamp lower bound 1', async () => {
      await useCase.execute(0);
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 }),
      );
    });

    it('фильтрует только bucket=telegram', async () => {
      await useCase.execute();
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { bucket: 'telegram' } }),
      );
    });

    it('от старых к новым (createdAt asc)', async () => {
      await useCase.execute();
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
      );
    });
  });

  describe('happy path — successful migration', () => {
    it('переносит TG-файл → Supabase, обновляет bucket+objectKey', async () => {
      prisma.mediaFile.findMany.mockResolvedValue([
        { id: 'm1', objectKey: 'tg:FILE_ID_123', mimeType: 'image/jpeg', createdAt: new Date('2026-01-01') },
      ]);
      tgStorage.getFileUrl.mockResolvedValue('https://api.telegram.org/file/bot.../photo.jpg');
      (axios.get as jest.Mock).mockResolvedValue({ data: new ArrayBuffer(1024) });

      const result = await useCase.execute();

      expect(tgStorage.getFileUrl).toHaveBeenCalledWith('FILE_ID_123');
      expect(r2Storage.uploadObject).toHaveBeenCalledWith(
        'savdo-public',
        expect.stringMatching(/^migrated\/2026\/.+\.jpg$/),
        expect.any(Buffer),
        'image/jpeg',
      );
      expect(prisma.mediaFile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm1' },
          data: expect.objectContaining({
            bucket: 'savdo-public',
            objectKey: expect.stringMatching(/^migrated\/2026\//),
            fileSize: BigInt(1024),
          }),
        }),
      );
      expect(result).toEqual({ migrated: 1, skipped: 0, failed: 0, errors: [] });
    });

    it('правильное расширение для каждого mimeType', async () => {
      const cases = [
        { mime: 'image/jpeg', ext: 'jpg' },
        { mime: 'image/png', ext: 'png' },
        { mime: 'image/webp', ext: 'webp' },
        { mime: 'application/octet-stream', ext: 'bin' },
      ];
      for (const { mime, ext } of cases) {
        prisma.mediaFile.findMany.mockResolvedValue([
          { id: 'm1', objectKey: 'tg:X', mimeType: mime, createdAt: new Date('2026-01-01') },
        ]);
        tgStorage.getFileUrl.mockResolvedValue('https://api.telegram.org/x');
        (axios.get as jest.Mock).mockResolvedValue({ data: new ArrayBuffer(1) });

        await useCase.execute();
        expect(r2Storage.uploadObject).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringMatching(new RegExp(`\\.${ext}$`)),
          expect.any(Buffer),
          mime,
        );
        r2Storage.uploadObject.mockClear();
      }
    });

    it('objectKey без префикса tg: тоже работает (legacy)', async () => {
      prisma.mediaFile.findMany.mockResolvedValue([
        { id: 'm1', objectKey: 'PLAIN_FILE_ID', mimeType: 'image/jpeg', createdAt: new Date('2026-01-01') },
      ]);
      tgStorage.getFileUrl.mockResolvedValue('https://x');
      (axios.get as jest.Mock).mockResolvedValue({ data: new ArrayBuffer(10) });

      await useCase.execute();
      expect(tgStorage.getFileUrl).toHaveBeenCalledWith('PLAIN_FILE_ID');
    });
  });

  describe('expired TG fileId — soft-delete via bucket marker', () => {
    it('404 от TG → bucket=telegram-expired, НЕ throws', async () => {
      prisma.mediaFile.findMany.mockResolvedValue([
        { id: 'm1', objectKey: 'tg:DEAD', mimeType: 'image/jpeg', createdAt: new Date('2026-01-01') },
      ]);
      const err: any = new Error('Telegram getFile failed');
      err.response = { status: 404 };
      tgStorage.getFileUrl.mockRejectedValue(err);

      const result = await useCase.execute();
      expect(prisma.mediaFile.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { bucket: 'telegram-expired' },
      });
      expect(result.skipped).toBe(1);
      expect(result.migrated).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('строка с "Telegram getFile failed" → soft-delete (даже без status=404)', async () => {
      prisma.mediaFile.findMany.mockResolvedValue([
        { id: 'm1', objectKey: 'tg:DEAD', mimeType: 'image/jpeg', createdAt: new Date('2026-01-01') },
      ]);
      tgStorage.getFileUrl.mockRejectedValue(new Error('Telegram getFile failed: Bad Request: file is too big'));

      const result = await useCase.execute();
      expect(result.skipped).toBe(1);
      expect(prisma.mediaFile.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { bucket: 'telegram-expired' },
      });
    });
  });

  describe('failures — НЕ помечает мёртвым', () => {
    it('не-404 ошибка идёт в errors[], bucket остаётся telegram', async () => {
      prisma.mediaFile.findMany.mockResolvedValue([
        { id: 'm1', objectKey: 'tg:OK', mimeType: 'image/jpeg', createdAt: new Date('2026-01-01') },
      ]);
      tgStorage.getFileUrl.mockResolvedValue('https://x');
      (axios.get as jest.Mock).mockRejectedValue(new Error('ECONNRESET'));

      const result = await useCase.execute();
      expect(result.failed).toBe(1);
      expect(result.errors).toEqual([{ mediaFileId: 'm1', error: 'ECONNRESET' }]);
      expect(prisma.mediaFile.update).not.toHaveBeenCalled();
    });

    it('upload fail → НЕ обновляет bucket, добавляет в errors', async () => {
      prisma.mediaFile.findMany.mockResolvedValue([
        { id: 'm1', objectKey: 'tg:X', mimeType: 'image/jpeg', createdAt: new Date('2026-01-01') },
      ]);
      tgStorage.getFileUrl.mockResolvedValue('https://x');
      (axios.get as jest.Mock).mockResolvedValue({ data: new ArrayBuffer(10) });
      r2Storage.uploadObject.mockRejectedValue(new Error('S3 SignatureDoesNotMatch'));

      const result = await useCase.execute();
      expect(result.failed).toBe(1);
      expect(prisma.mediaFile.update).not.toHaveBeenCalled();
    });
  });

  describe('batch processing — несколько файлов', () => {
    it('обрабатывает каждый, считает счётчики правильно', async () => {
      prisma.mediaFile.findMany.mockResolvedValue([
        { id: 'm1', objectKey: 'tg:OK1', mimeType: 'image/jpeg', createdAt: new Date('2026-01-01') },
        { id: 'm2', objectKey: 'tg:DEAD', mimeType: 'image/jpeg', createdAt: new Date('2026-02-01') },
        { id: 'm3', objectKey: 'tg:FAIL', mimeType: 'image/jpeg', createdAt: new Date('2026-03-01') },
      ]);
      tgStorage.getFileUrl
        .mockResolvedValueOnce('https://ok1')
        .mockRejectedValueOnce(Object.assign(new Error('expired'), { response: { status: 404 } }))
        .mockResolvedValueOnce('https://fail');
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: new ArrayBuffer(100) }) // m1 download OK
        .mockRejectedValueOnce(new Error('network')); // m3 download fail

      const result = await useCase.execute();
      expect(result).toEqual({
        migrated: 1,  // m1
        skipped: 1,   // m2 expired
        failed: 1,    // m3 network err
        errors: [{ mediaFileId: 'm3', error: 'network' }],
      });
    });

    it('пустой батч — все нули', async () => {
      const result = await useCase.execute();
      expect(result).toEqual({ migrated: 0, skipped: 0, failed: 0, errors: [] });
    });
  });
});
