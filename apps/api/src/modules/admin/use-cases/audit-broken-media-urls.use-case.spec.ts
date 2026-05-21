/**
 * Тесты для `AuditBrokenMediaUrlsUseCase` (API-PRODUCT-IMAGES-BROKEN-SUPABASE-URLS-001).
 *
 * Покрытие:
 *   - STORAGE_PUBLIC_URL не задан → пустой результат, без обращения к БД
 *   - нет кандидатов → пустой результат
 *   - живые URL → ok, updateMany НЕ вызывается
 *   - мёртвые URL (404 / сетевая ошибка) → bucket='broken', markedIds
 *   - cursor-пагинация: `id: { gt: cursorId }`, nextCursor full vs partial batch
 *   - clamp limit
 */
import { AuditBrokenMediaUrlsUseCase } from './audit-broken-media-urls.use-case';
import { PrismaService } from '../../../database/prisma.service';

jest.mock('axios');
import axios from 'axios';

describe('AuditBrokenMediaUrlsUseCase', () => {
  let useCase: AuditBrokenMediaUrlsUseCase;
  let prisma: { mediaFile: { findMany: jest.Mock; updateMany: jest.Mock } };
  const ORIGINAL_ENV = process.env.STORAGE_PUBLIC_URL;

  beforeEach(() => {
    process.env.STORAGE_PUBLIC_URL = 'https://cdn.example.com';
    prisma = {
      mediaFile: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    useCase = new AuditBrokenMediaUrlsUseCase(prisma as unknown as PrismaService);
    (axios.head as jest.Mock).mockReset();
  });

  afterAll(() => {
    process.env.STORAGE_PUBLIC_URL = ORIGINAL_ENV;
  });

  it('STORAGE_PUBLIC_URL не задан → пустой результат, БД не трогается', async () => {
    delete process.env.STORAGE_PUBLIC_URL;
    const result = await useCase.execute();
    expect(result).toEqual({ scanned: 0, broken: 0, ok: 0, markedIds: [], nextCursor: null });
    expect(prisma.mediaFile.findMany).not.toHaveBeenCalled();
  });

  it('нет кандидатов → пустой результат', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result.scanned).toBe(0);
    expect(result.nextCursor).toBeNull();
    expect(axios.head).not.toHaveBeenCalled();
  });

  it('все URL живые → ok, updateMany НЕ вызывается', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([
      { id: 'm-1', objectKey: 'a.jpg' },
      { id: 'm-2', objectKey: 'b.jpg' },
    ]);
    (axios.head as jest.Mock).mockResolvedValue({ status: 200 });
    const result = await useCase.execute({ limit: 100 });
    expect(result.scanned).toBe(2);
    expect(result.ok).toBe(2);
    expect(result.broken).toBe(0);
    expect(result.markedIds).toEqual([]);
    expect(prisma.mediaFile.updateMany).not.toHaveBeenCalled();
  });

  it('мёртвый URL (404) → помечается broken', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([
      { id: 'm-1', objectKey: 'ok.jpg' },
      { id: 'm-2', objectKey: 'dead.jpg' },
    ]);
    (axios.head as jest.Mock).mockImplementation((url: string) =>
      url.endsWith('dead.jpg') ? Promise.resolve({ status: 404 }) : Promise.resolve({ status: 200 }),
    );
    const result = await useCase.execute({ limit: 100 });
    expect(result.broken).toBe(1);
    expect(result.ok).toBe(1);
    expect(result.markedIds).toEqual(['m-2']);
    expect(prisma.mediaFile.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['m-2'] } },
      data: { bucket: 'broken' },
    });
  });

  it('сетевая ошибка на HEAD → URL считается мёртвым', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([{ id: 'm-1', objectKey: 'x.jpg' }]);
    (axios.head as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await useCase.execute();
    expect(result.broken).toBe(1);
    expect(result.markedIds).toEqual(['m-1']);
  });

  it('cursorId пробрасывается в where как id > cursorId', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([]);
    await useCase.execute({ cursorId: 'm-50' });
    expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { gt: 'm-50' } }),
      }),
    );
  });

  it('полный батч → nextCursor = id последней записи', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([
      { id: 'm-1', objectKey: 'a.jpg' },
      { id: 'm-2', objectKey: 'b.jpg' },
    ]);
    (axios.head as jest.Mock).mockResolvedValue({ status: 200 });
    const result = await useCase.execute({ limit: 2 });
    expect(result.nextCursor).toBe('m-2');
  });

  it('неполный батч → nextCursor null (конец таблицы)', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([{ id: 'm-1', objectKey: 'a.jpg' }]);
    (axios.head as jest.Mock).mockResolvedValue({ status: 200 });
    const result = await useCase.execute({ limit: 50 });
    expect(result.nextCursor).toBeNull();
  });

  it('limit clamp: >500 → 500, передаётся в take', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([]);
    await useCase.execute({ limit: 9999 });
    expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 }),
    );
  });

  it('невалидный limit → дефолт 100', async () => {
    prisma.mediaFile.findMany.mockResolvedValue([]);
    await useCase.execute({ limit: NaN });
    expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });
});
