/**
 * Объединённые тесты: Create/Update/Delete/Get StoreCategory + GetGlobal.
 *
 * Главное:
 *   - INV: store не может иметь >20 категорий (STORE_CATEGORY_LIMIT)
 *   - ownership check (cross-store защита)
 */
import { CreateStoreCategoryUseCase } from './create-store-category.use-case';
import { UpdateStoreCategoryUseCase } from './update-store-category.use-case';
import { DeleteStoreCategoryUseCase } from './delete-store-category.use-case';
import { GetStoreCategoriesUseCase } from './get-store-categories.use-case';
import { GetGlobalCategoriesUseCase } from './get-global-categories.use-case';
import { StoreCategoriesRepository } from '../repositories/store-categories.repository';
import { GlobalCategoriesRepository } from '../repositories/global-categories.repository';

const CAT = { id: 'cat-1', storeId: 'store-1', name: 'Phones', sortOrder: 1 };

describe('CreateStoreCategoryUseCase', () => {
  let useCase: CreateStoreCategoryUseCase;
  let repo: { countByStoreId: jest.Mock; create: jest.Mock };

  beforeEach(() => {
    repo = {
      countByStoreId: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(CAT),
    };
    useCase = new CreateStoreCategoryUseCase(repo as unknown as StoreCategoriesRepository);
  });

  it('happy path: count=0 → create', async () => {
    const result = await useCase.execute('store-1', { name: 'Phones', sortOrder: 1 });
    expect(repo.create).toHaveBeenCalledWith('store-1', { name: 'Phones', sortOrder: 1 });
    expect(result.id).toBe('cat-1');
  });

  it('count=19 (граница) → create allowed', async () => {
    repo.countByStoreId.mockResolvedValue(19);
    await expect(useCase.execute('store-1', { name: 'X' })).resolves.toBeDefined();
  });

  it('count=20 → STORE_CATEGORY_LIMIT', async () => {
    repo.countByStoreId.mockResolvedValue(20);
    await expect(useCase.execute('store-1', { name: 'Overflow' }))
      .rejects.toThrow(/cannot have more than 20/);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('count=999 → также блокирует', async () => {
    repo.countByStoreId.mockResolvedValue(999);
    await expect(useCase.execute('store-1', { name: 'X' }))
      .rejects.toThrow(/cannot have more than 20/);
  });
});

describe('UpdateStoreCategoryUseCase', () => {
  let useCase: UpdateStoreCategoryUseCase;
  let repo: { findById: jest.Mock; update: jest.Mock };

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(CAT),
      update: jest.fn().mockResolvedValue({ ...CAT, name: 'Updated' }),
    };
    useCase = new UpdateStoreCategoryUseCase(repo as unknown as StoreCategoriesRepository);
  });

  it('not found → CATEGORY_NOT_FOUND', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('cat-missing', 'store-1', { name: 'X' }))
      .rejects.toThrow(/Category not found/);
  });

  it('cross-store → FORBIDDEN', async () => {
    repo.findById.mockResolvedValue({ ...CAT, storeId: 'store-OTHER' });
    await expect(useCase.execute('cat-1', 'store-1', { name: 'X' }))
      .rejects.toThrow(/does not belong to your store/);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('happy: update name + sortOrder', async () => {
    const result = await useCase.execute('cat-1', 'store-1', { name: 'Updated', sortOrder: 5 });
    expect(repo.update).toHaveBeenCalledWith('cat-1', { name: 'Updated', sortOrder: 5 });
    expect(result.name).toBe('Updated');
  });
});

describe('DeleteStoreCategoryUseCase', () => {
  let useCase: DeleteStoreCategoryUseCase;
  let repo: { findById: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(CAT),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteStoreCategoryUseCase(repo as unknown as StoreCategoriesRepository);
  });

  it('not found → 404', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', 'store-1')).rejects.toThrow(/not found/);
  });

  it('cross-store → 403', async () => {
    repo.findById.mockResolvedValue({ ...CAT, storeId: 'store-OTHER' });
    await expect(useCase.execute('cat-1', 'store-1')).rejects.toThrow(/does not belong/);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('happy: delete', async () => {
    await useCase.execute('cat-1', 'store-1');
    expect(repo.delete).toHaveBeenCalledWith('cat-1');
  });
});

describe('GetStoreCategoriesUseCase', () => {
  it('возвращает категории по storeId', async () => {
    const repo = { findByStoreId: jest.fn().mockResolvedValue([CAT]) };
    const useCase = new GetStoreCategoriesUseCase(repo as unknown as StoreCategoriesRepository);
    const result = await useCase.execute('store-1');
    expect(repo.findByStoreId).toHaveBeenCalledWith('store-1');
    expect(result).toEqual([CAT]);
  });
});

describe('GetGlobalCategoriesUseCase', () => {
  it('возвращает только active', async () => {
    const repo = { findAllActive: jest.fn().mockResolvedValue([{ id: 'g-1', name: 'Electronics' }]) };
    const useCase = new GetGlobalCategoriesUseCase(repo as unknown as GlobalCategoriesRepository);
    const result = await useCase.execute();
    expect(repo.findAllActive).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});
