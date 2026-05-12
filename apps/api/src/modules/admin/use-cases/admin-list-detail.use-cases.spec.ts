/**
 * Тривиальные admin proxy use-cases:
 *   - List* (Users/Stores/Sellers): передача фильтров в repo
 *   - Get*Detail (User/Store/Seller): not found → DomainException
 *   - GetAuditLog: pagination + filters
 *   - AuthGetMe: not found → UnauthorizedException
 */
import { ListUsersUseCase } from './list-users.use-case';
import { ListStoresUseCase } from './list-stores.use-case';
import { ListSellersUseCase } from './list-sellers.use-case';
import { GetUserDetailUseCase } from './get-user-detail.use-case';
import { GetStoreDetailUseCase } from './get-store-detail.use-case';
import { GetSellerDetailUseCase } from './get-seller-detail.use-case';
import { GetAuditLogUseCase } from './get-audit-log.use-case';
import { GetMeUseCase } from '../../auth/use-cases/get-me.use-case';
import { AdminRepository } from '../repositories/admin.repository';
import { AuthRepository } from '../../auth/repositories/auth.repository';

describe('ListUsersUseCase', () => {
  it('передаёт {role,status,search,page,limit} в repo.findUsers', async () => {
    const repo = { findUsers: jest.fn().mockResolvedValue({ users: [], total: 0 }) };
    const useCase = new ListUsersUseCase(repo as unknown as AdminRepository);
    await useCase.execute({
      role: 'BUYER', status: 'ACTIVE', search: 'john', page: 2, limit: 10,
    } as any);
    expect(repo.findUsers).toHaveBeenCalledWith({
      role: 'BUYER', status: 'ACTIVE', search: 'john', page: 2, limit: 10,
    });
  });
});

describe('ListStoresUseCase', () => {
  it('передаёт {status,page,limit} в repo.findStores', async () => {
    const repo = { findStores: jest.fn().mockResolvedValue({ stores: [], total: 0 }) };
    const useCase = new ListStoresUseCase(repo as unknown as AdminRepository);
    await useCase.execute({ status: 'APPROVED', page: 1, limit: 20 } as any);
    expect(repo.findStores).toHaveBeenCalledWith({ status: 'APPROVED', page: 1, limit: 20 });
  });
});

describe('ListSellersUseCase', () => {
  it('передаёт {verificationStatus,search,page,limit}', async () => {
    const repo = { findSellers: jest.fn().mockResolvedValue({ sellers: [], total: 0 }) };
    const useCase = new ListSellersUseCase(repo as unknown as AdminRepository);
    await useCase.execute({ verificationStatus: 'PENDING', search: '', page: 1, limit: 50 } as any);
    expect(repo.findSellers).toHaveBeenCalledWith({
      verificationStatus: 'PENDING', search: '', page: 1, limit: 50,
    });
  });
});

describe('GetUserDetailUseCase', () => {
  let useCase: GetUserDetailUseCase;
  let repo: { findUserById: jest.Mock };

  beforeEach(() => {
    repo = { findUserById: jest.fn() };
    useCase = new GetUserDetailUseCase(repo as unknown as AdminRepository);
  });

  it('not found → DomainException', async () => {
    repo.findUserById.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toThrow(/User not found/);
  });

  it('happy: return user', async () => {
    repo.findUserById.mockResolvedValue({ id: 'u-1', phone: '+998900000001' });
    const result = await useCase.execute('u-1');
    expect(result).toEqual({ id: 'u-1', phone: '+998900000001' });
  });
});

describe('GetStoreDetailUseCase', () => {
  let useCase: GetStoreDetailUseCase;
  let repo: { findStoreById: jest.Mock };

  beforeEach(() => {
    repo = { findStoreById: jest.fn() };
    useCase = new GetStoreDetailUseCase(repo as unknown as AdminRepository);
  });

  it('not found → STORE_NOT_FOUND', async () => {
    repo.findStoreById.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toThrow(/Store not found/);
  });

  it('happy: return store', async () => {
    repo.findStoreById.mockResolvedValue({ id: 'store-1' });
    expect(await useCase.execute('store-1')).toEqual({ id: 'store-1' });
  });
});

describe('GetSellerDetailUseCase', () => {
  let useCase: GetSellerDetailUseCase;
  let repo: { findSellerById: jest.Mock };

  beforeEach(() => {
    repo = { findSellerById: jest.fn() };
    useCase = new GetSellerDetailUseCase(repo as unknown as AdminRepository);
  });

  it('not found → 404', async () => {
    repo.findSellerById.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toThrow(/Seller not found/);
  });

  it('happy: return seller', async () => {
    repo.findSellerById.mockResolvedValue({ id: 'seller-1' });
    expect(await useCase.execute('seller-1')).toEqual({ id: 'seller-1' });
  });
});

describe('GetAuditLogUseCase', () => {
  it('передаёт {actorUserId,entityType,entityId,page,limit} в repo.findAuditLogs', async () => {
    const repo = { findAuditLogs: jest.fn().mockResolvedValue({ logs: [], total: 0 }) };
    const useCase = new GetAuditLogUseCase(repo as unknown as AdminRepository);
    await useCase.execute({
      actorUserId: 'u-1', entityType: 'order', entityId: 'ord-1', page: 1, limit: 20,
    } as any);
    expect(repo.findAuditLogs).toHaveBeenCalledWith({
      actorUserId: 'u-1', entityType: 'order', entityId: 'ord-1', page: 1, limit: 20,
    });
  });
});

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let repo: { findUserById: jest.Mock };

  beforeEach(() => {
    repo = { findUserById: jest.fn() };
    useCase = new GetMeUseCase(repo as unknown as AuthRepository);
  });

  it('user не найден → UnauthorizedException', async () => {
    repo.findUserById.mockResolvedValue(null);
    await expect(useCase.execute('u-1')).rejects.toThrow(/User not found/);
  });

  it('happy: { success: true, data: user }', async () => {
    repo.findUserById.mockResolvedValue({ id: 'u-1', phone: '+998900000001' });
    const result = await useCase.execute('u-1');
    expect(result).toEqual({
      success: true,
      data: { id: 'u-1', phone: '+998900000001' },
    });
  });
});
