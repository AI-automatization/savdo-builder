/**
 * Тесты для `AdminUpdateStoreChannelUseCase` (P1-1, audit-2026-06-04).
 *
 * Покрытие:
 *   - store not found → STORE_NOT_FOUND
 *   - нормализация форматов: @user / user / https://t.me/user / t.me/user / numeric
 *   - "" → NULL (очистка)
 *   - undefined → не трогать
 *   - невалидный формат → VALIDATION_ERROR
 *   - audit log STORE_CHANNEL_UPDATED с before/after
 *   - noop (нет ни одного поля) → no update, no audit
 */
import { AdminUpdateStoreChannelUseCase } from './admin-update-store-channel.use-case';
import { AdminRepository } from '../repositories/admin.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('AdminUpdateStoreChannelUseCase', () => {
  let useCase: AdminUpdateStoreChannelUseCase;
  let adminRepo: { findStoreById: jest.Mock; writeAuditLog: jest.Mock };
  let prisma: { store: { update: jest.Mock } };

  beforeEach(() => {
    adminRepo = {
      findStoreById: jest.fn().mockResolvedValue({
        id: 's-1', telegramChannelId: null, telegramChannelTitle: null,
      }),
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      store: {
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 's-1',
          telegramChannelId: data.telegramChannelId ?? null,
          telegramChannelTitle: data.telegramChannelTitle ?? null,
        })),
      },
    };
    useCase = new AdminUpdateStoreChannelUseCase(
      adminRepo as unknown as AdminRepository,
      prisma as unknown as PrismaService,
    );
  });

  describe('normalizeChannelId (pure)', () => {
    it.each([
      ['@my_channel',                '@my_channel'],
      ['my_channel',                 '@my_channel'],
      ['https://t.me/my_channel',    '@my_channel'],
      ['http://t.me/my_channel',     '@my_channel'],
      ['t.me/my_channel',            '@my_channel'],
      ['telegram.me/my_channel',     '@my_channel'],
      ['https://t.me/my_channel/',   '@my_channel'],
      ['-1001234567890',             '-1001234567890'],
      ['  @my_channel  ',            '@my_channel'],
    ])('%s → %s', (input, expected) => {
      expect(AdminUpdateStoreChannelUseCase.normalizeChannelId(input)).toBe(expected);
    });

    it.each([
      ['ab',                         null], // too short
      ['a'.repeat(33),               null], // too long
      ['bad name',                   null], // space inside
      ['',                           null], // empty
      ['https://example.com/foo',    null], // not t.me
    ])('reject: %s', (input) => {
      expect(AdminUpdateStoreChannelUseCase.normalizeChannelId(input)).toBe(null);
    });
  });

  it('store not found → STORE_NOT_FOUND', async () => {
    adminRepo.findStoreById.mockResolvedValue(null);
    await expect(useCase.execute({
      storeId: 's-x', actorUserId: 'a-1', telegramChannelId: '@foo123',
    })).rejects.toThrow(/Store not found/);
  });

  it('сохраняет нормализованный @username', async () => {
    const result = await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', telegramChannelId: 'https://t.me/my_channel',
    });
    expect(prisma.store.update).toHaveBeenCalledWith({
      where: { id: 's-1' },
      data: { telegramChannelId: '@my_channel' },
      select: expect.any(Object),
    });
    expect(result.telegramChannelId).toBe('@my_channel');
  });

  it('"" → NULL (очистка канала)', async () => {
    adminRepo.findStoreById.mockResolvedValue({
      id: 's-1', telegramChannelId: '@old', telegramChannelTitle: 'Old',
    });
    await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', telegramChannelId: '',
    });
    expect(prisma.store.update).toHaveBeenCalledWith({
      where: { id: 's-1' },
      data: { telegramChannelId: null },
      select: expect.any(Object),
    });
  });

  it('невалидный формат → VALIDATION_ERROR', async () => {
    await expect(useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', telegramChannelId: 'https://example.com/foo',
    })).rejects.toThrow(/Invalid Telegram channel format/);
    expect(prisma.store.update).not.toHaveBeenCalled();
  });

  it('пишет audit STORE_CHANNEL_UPDATED с before/after', async () => {
    adminRepo.findStoreById.mockResolvedValue({
      id: 's-1', telegramChannelId: '@old_chan', telegramChannelTitle: 'Old',
    });
    await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1',
      telegramChannelId: '@new_chan', telegramChannelTitle: 'New',
    });
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'STORE_CHANNEL_UPDATED',
      entityType: 'Store',
      entityId: 's-1',
      payload: expect.objectContaining({
        previousChannelId: '@old_chan',
        newChannelId: '@new_chan',
        previousChannelTitle: 'Old',
        newChannelTitle: 'New',
      }),
    }));
  });

  it('noop: не передано ни одного поля → no update, no audit', async () => {
    const result = await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1',
    });
    expect(prisma.store.update).not.toHaveBeenCalled();
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    expect(result.telegramChannelId).toBe(null);
  });

  it('сохраняет только title если channelId не передан', async () => {
    await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', telegramChannelTitle: 'My Channel',
    });
    expect(prisma.store.update).toHaveBeenCalledWith({
      where: { id: 's-1' },
      data: { telegramChannelTitle: 'My Channel' },
      select: expect.any(Object),
    });
  });
});
