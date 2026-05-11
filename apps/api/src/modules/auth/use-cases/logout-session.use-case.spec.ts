/**
 * Тесты для `LogoutSessionUseCase`.
 *
 * Тривиально, но важно: ошибка в deleteSession не должна показывать 500
 * на logout (UX consistency — токен на клиенте уже стирается).
 */
import { LogoutSessionUseCase } from './logout-session.use-case';
import { AuthRepository } from '../repositories/auth.repository';

describe('LogoutSessionUseCase', () => {
  let useCase: LogoutSessionUseCase;
  let authRepo: { deleteSession: jest.Mock };

  beforeEach(() => {
    authRepo = { deleteSession: jest.fn().mockResolvedValue(undefined) };
    useCase = new LogoutSessionUseCase(authRepo as unknown as AuthRepository);
  });

  it('happy: deleteSession(sessionId)', async () => {
    await useCase.execute('sess-1');
    expect(authRepo.deleteSession).toHaveBeenCalledWith('sess-1');
  });

  it('deleteSession throws → НЕ пробрасывается (logout всегда 200)', async () => {
    authRepo.deleteSession.mockRejectedValue(new Error('DB down'));
    await expect(useCase.execute('sess-1')).resolves.toBeUndefined();
  });

  it('non-Error rejection → НЕ пробрасывается', async () => {
    authRepo.deleteSession.mockRejectedValue('string error');
    await expect(useCase.execute('sess-1')).resolves.toBeUndefined();
  });
});
