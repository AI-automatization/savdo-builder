/**
 * Объединённые тесты для notifications use-cases:
 *   - GetInbox: pagination defaults (page=1, limit=20), unreadOnly forwarding
 *   - DeleteInboxNotification, MarkInboxRead, MarkAllInboxRead — proxy ops
 *   - GetPreferences: schema defaults для null pref row
 *   - UpdatePreference: upsert с переданными значениями
 *   - GetNotificationLogs: pagination + filters
 */
import { GetInboxUseCase } from './get-inbox.use-case';
import { DeleteInboxNotificationUseCase } from './delete-inbox-notification.use-case';
import { MarkInboxReadUseCase } from './mark-inbox-read.use-case';
import { MarkAllInboxReadUseCase } from './mark-all-inbox-read.use-case';
import { GetPreferencesUseCase } from './get-preferences.use-case';
import { UpdatePreferenceUseCase } from './update-preference.use-case';
import { GetNotificationLogsUseCase } from './get-notification-logs.use-case';
import { NotificationRepository } from '../repositories/notification.repository';

describe('GetInboxUseCase', () => {
  let useCase: GetInboxUseCase;
  let repo: { findInAppByUserId: jest.Mock };

  beforeEach(() => {
    repo = {
      findInAppByUserId: jest.fn().mockResolvedValue({
        notifications: [],
        total: 0,
        unreadCount: 0,
      }),
    };
    useCase = new GetInboxUseCase(repo as unknown as NotificationRepository);
  });

  it('default page=1, limit=20', async () => {
    await useCase.execute({ userId: 'u-1', query: {} });
    expect(repo.findInAppByUserId).toHaveBeenCalledWith('u-1', {
      unreadOnly: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('передаёт unreadOnly + page/limit', async () => {
    await useCase.execute({ userId: 'u-1', query: { unreadOnly: true, page: 3, limit: 50 } as any });
    expect(repo.findInAppByUserId).toHaveBeenCalledWith('u-1', {
      unreadOnly: true,
      page: 3,
      limit: 50,
    });
  });

  it('возвращает {notifications, total, unreadCount, page, limit}', async () => {
    repo.findInAppByUserId.mockResolvedValue({
      notifications: [{ id: 'n-1' }],
      total: 5,
      unreadCount: 2,
    });
    const result = await useCase.execute({ userId: 'u-1', query: { page: 2 } as any });
    expect(result).toEqual({
      notifications: [{ id: 'n-1' }],
      total: 5,
      unreadCount: 2,
      page: 2,
      limit: 20,
    });
  });
});

describe('DeleteInboxNotificationUseCase', () => {
  it('proxy в repo.deleteInApp(id, userId)', async () => {
    const repo = { deleteInApp: jest.fn().mockResolvedValue(undefined) };
    const useCase = new DeleteInboxNotificationUseCase(repo as unknown as NotificationRepository);
    await useCase.execute({ id: 'n-1', userId: 'u-1' });
    expect(repo.deleteInApp).toHaveBeenCalledWith('n-1', 'u-1');
  });
});

describe('MarkInboxReadUseCase', () => {
  it('proxy в repo.markInAppRead(id, userId)', async () => {
    const repo = { markInAppRead: jest.fn().mockResolvedValue(undefined) };
    const useCase = new MarkInboxReadUseCase(repo as unknown as NotificationRepository);
    await useCase.execute({ id: 'n-1', userId: 'u-1' });
    expect(repo.markInAppRead).toHaveBeenCalledWith('n-1', 'u-1');
  });
});

describe('MarkAllInboxReadUseCase', () => {
  it('proxy в repo.markAllInAppRead(userId)', async () => {
    const repo = { markAllInAppRead: jest.fn().mockResolvedValue(undefined) };
    const useCase = new MarkAllInboxReadUseCase(repo as unknown as NotificationRepository);
    await useCase.execute('u-1');
    expect(repo.markAllInAppRead).toHaveBeenCalledWith('u-1');
  });
});

describe('GetPreferencesUseCase', () => {
  let useCase: GetPreferencesUseCase;
  let repo: { findPreferences: jest.Mock };

  beforeEach(() => {
    repo = { findPreferences: jest.fn() };
    useCase = new GetPreferencesUseCase(repo as unknown as NotificationRepository);
  });

  it('null row → schema defaults (mobilePush=true, webPush=false, telegram=true)', async () => {
    repo.findPreferences.mockResolvedValue(null);
    const result = await useCase.execute('u-1');
    expect(result).toEqual({
      mobilePushEnabled: true,
      webPushEnabled: false,
      telegramEnabled: true,
    });
  });

  it('существующая row → возвращает её значения', async () => {
    repo.findPreferences.mockResolvedValue({
      mobilePushEnabled: false,
      webPushEnabled: true,
      telegramEnabled: false,
    });
    const result = await useCase.execute('u-1');
    expect(result).toEqual({
      mobilePushEnabled: false,
      webPushEnabled: true,
      telegramEnabled: false,
    });
  });
});

describe('UpdatePreferenceUseCase', () => {
  it('upsert с DTO значениями', async () => {
    const repo = { upsertPreferences: jest.fn().mockResolvedValue({ id: 'pref-1' }) };
    const useCase = new UpdatePreferenceUseCase(repo as unknown as NotificationRepository);
    await useCase.execute({
      userId: 'u-1',
      dto: { mobilePushEnabled: false, webPushEnabled: true, telegramEnabled: false } as any,
    });
    expect(repo.upsertPreferences).toHaveBeenCalledWith('u-1', {
      mobilePushEnabled: false,
      webPushEnabled: true,
      telegramEnabled: false,
    });
  });
});

describe('GetNotificationLogsUseCase', () => {
  let useCase: GetNotificationLogsUseCase;
  let repo: { findByUserId: jest.Mock };

  beforeEach(() => {
    repo = { findByUserId: jest.fn().mockResolvedValue({ logs: [], total: 0 }) };
    useCase = new GetNotificationLogsUseCase(repo as unknown as NotificationRepository);
  });

  it('default page=1, limit=20', async () => {
    await useCase.execute({ userId: 'u-1', query: {} as any });
    expect(repo.findByUserId).toHaveBeenCalledWith('u-1', expect.objectContaining({ page: 1, limit: 20 }));
  });

  it('передаёт filters: channel, eventType, deliveryStatus', async () => {
    await useCase.execute({
      userId: 'u-1',
      query: {
        channel: 'TELEGRAM',
        eventType: 'order.created',
        deliveryStatus: 'SENT',
        page: 2,
        limit: 10,
      } as any,
    });
    expect(repo.findByUserId).toHaveBeenCalledWith('u-1', {
      channel: 'TELEGRAM',
      eventType: 'order.created',
      deliveryStatus: 'SENT',
      page: 2,
      limit: 10,
    });
  });

  it('возвращает logs/total/page/limit', async () => {
    repo.findByUserId.mockResolvedValue({ logs: [{ id: 'log-1' }], total: 3 });
    const result = await useCase.execute({ userId: 'u-1', query: { page: 5 } as any });
    expect(result).toEqual({ logs: [{ id: 'log-1' }], total: 3, page: 5, limit: 20 });
  });
});
