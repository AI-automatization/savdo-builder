/**
 * Объединённые тесты для media use-cases:
 *   - RequestUploadUseCase: validation mimeType per purpose, bucket pick (private/public),
 *     visibility (PROTECTED for seller_doc, PRIVATE for images), R2-not-configured fail.
 *   - ConfirmUploadUseCase: ownership, idempotency (PUBLIC/PROTECTED → no-op).
 *   - DeleteMediaUseCase: ownership, R2 delete + DB delete order.
 */
import { ConfigService } from '@nestjs/config';
import { MediaVisibility } from '@prisma/client';
import { RequestUploadUseCase } from './request-upload.use-case';
import { ConfirmUploadUseCase } from './confirm-upload.use-case';
import { DeleteMediaUseCase } from './delete-media.use-case';
import { R2StorageService } from '../services/r2-storage.service';
import { MediaRepository } from '../repositories/media.repository';

describe('RequestUploadUseCase', () => {
  let useCase: RequestUploadUseCase;
  let r2: { isConfigured: jest.Mock; generateUploadUrl: jest.Mock };
  let mediaRepo: { create: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    r2 = {
      isConfigured: jest.fn().mockReturnValue(true),
      generateUploadUrl: jest.fn().mockResolvedValue({ uploadUrl: 'https://r2/x', expiresIn: 600 }),
    };
    mediaRepo = { create: jest.fn().mockResolvedValue({ id: 'media-1' }) };
    config = { get: jest.fn() };
    useCase = new RequestUploadUseCase(
      r2 as unknown as R2StorageService,
      mediaRepo as unknown as MediaRepository,
      config as unknown as ConfigService,
    );
  });

  it('R2 не сконфигурирован → SERVICE_UNAVAILABLE', async () => {
    r2.isConfigured.mockReturnValue(false);
    await expect(useCase.execute('u-1', { mimeType: 'image/jpeg', purpose: 'product_image', sizeBytes: 100 }))
      .rejects.toThrow(/storage is not configured/);
  });

  it('product_image + image/jpeg → ok, public bucket, PRIVATE visibility', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'storage.bucketPublic') return 'savdo-public';
      return undefined;
    });
    await useCase.execute('u-1', { mimeType: 'image/jpeg', purpose: 'product_image', sizeBytes: 1000 });
    expect(mediaRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      bucket: 'savdo-public',
      mimeType: 'image/jpeg',
      visibility: MediaVisibility.PRIVATE,
    }));
  });

  it('product_image + application/pdf → MEDIA_UPLOAD_TYPE_NOT_ALLOWED', async () => {
    await expect(useCase.execute('u-1', { mimeType: 'application/pdf', purpose: 'product_image', sizeBytes: 100 }))
      .rejects.toThrow(/not allowed for purpose product_image/);
  });

  it('store_logo + image/png → ok', async () => {
    await expect(useCase.execute('u-1', { mimeType: 'image/png', purpose: 'store_logo', sizeBytes: 100 }))
      .resolves.toBeDefined();
  });

  it('seller_doc + application/pdf → ok, private bucket, PROTECTED visibility', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'storage.bucketPrivate') return 'savdo-private';
      return undefined;
    });
    await useCase.execute('u-1', { mimeType: 'application/pdf', purpose: 'seller_doc', sizeBytes: 100 });
    expect(mediaRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      bucket: 'savdo-private',
      visibility: MediaVisibility.PROTECTED,
    }));
  });

  it('seller_doc + image/jpeg → ok (документы могут быть фото)', async () => {
    await expect(useCase.execute('u-1', { mimeType: 'image/jpeg', purpose: 'seller_doc', sizeBytes: 100 }))
      .resolves.toBeDefined();
  });

  it('objectKey содержит purpose/userId/uuid.ext', async () => {
    await useCase.execute('u-1', { mimeType: 'image/webp', purpose: 'product_image', sizeBytes: 100 });
    const createCall = mediaRepo.create.mock.calls[0][0];
    expect(createCall.objectKey).toMatch(/^product_image\/u-1\/[a-f0-9-]+\.webp$/);
  });

  it('возвращает {mediaFileId, uploadUrl, expiresIn, objectKey}', async () => {
    const result = await useCase.execute('u-1', { mimeType: 'image/jpeg', purpose: 'product_image', sizeBytes: 100 });
    expect(result.mediaFileId).toBe('media-1');
    expect(result.uploadUrl).toBe('https://r2/x');
    expect(result.expiresIn).toBe(600);
    expect(result.objectKey).toMatch(/\.jpg$/);
  });
});

describe('ConfirmUploadUseCase', () => {
  let useCase: ConfirmUploadUseCase;
  let mediaRepo: { findById: jest.Mock; confirm: jest.Mock };

  beforeEach(() => {
    mediaRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'media-1', ownerUserId: 'u-1', visibility: MediaVisibility.PRIVATE }),
      confirm: jest.fn().mockResolvedValue({ id: 'media-1', visibility: MediaVisibility.PUBLIC }),
    };
    useCase = new ConfirmUploadUseCase(mediaRepo as unknown as MediaRepository);
  });

  it('not found → 404', async () => {
    mediaRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', 'u-1')).rejects.toThrow(/not found/);
  });

  it('чужой owner → FORBIDDEN', async () => {
    mediaRepo.findById.mockResolvedValue({ id: 'media-1', ownerUserId: 'u-OTHER', visibility: MediaVisibility.PRIVATE });
    await expect(useCase.execute('media-1', 'u-1')).rejects.toThrow(/do not own/);
    expect(mediaRepo.confirm).not.toHaveBeenCalled();
  });

  it('PRIVATE → confirm (PUBLIC)', async () => {
    const result = await useCase.execute('media-1', 'u-1');
    expect(mediaRepo.confirm).toHaveBeenCalledWith('media-1');
    expect(result.visibility).toBe(MediaVisibility.PUBLIC);
  });

  it('уже PUBLIC → idempotent (no-op)', async () => {
    mediaRepo.findById.mockResolvedValue({ id: 'media-1', ownerUserId: 'u-1', visibility: MediaVisibility.PUBLIC });
    const result = await useCase.execute('media-1', 'u-1');
    expect(mediaRepo.confirm).not.toHaveBeenCalled();
    expect(result.visibility).toBe(MediaVisibility.PUBLIC);
  });

  it('уже PROTECTED (seller_doc) → idempotent', async () => {
    mediaRepo.findById.mockResolvedValue({ id: 'media-1', ownerUserId: 'u-1', visibility: MediaVisibility.PROTECTED });
    await useCase.execute('media-1', 'u-1');
    expect(mediaRepo.confirm).not.toHaveBeenCalled();
  });
});

describe('DeleteMediaUseCase', () => {
  let useCase: DeleteMediaUseCase;
  let r2: { deleteObject: jest.Mock };
  let mediaRepo: { findById: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    r2 = { deleteObject: jest.fn().mockResolvedValue(undefined) };
    mediaRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'media-1',
        ownerUserId: 'u-1',
        bucket: 'savdo-public',
        objectKey: 'product_image/u-1/abc.jpg',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteMediaUseCase(
      r2 as unknown as R2StorageService,
      mediaRepo as unknown as MediaRepository,
    );
  });

  it('not found → 404', async () => {
    mediaRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', 'u-1')).rejects.toThrow(/not found/);
  });

  it('чужой owner → FORBIDDEN', async () => {
    mediaRepo.findById.mockResolvedValue({ id: 'media-1', ownerUserId: 'u-OTHER' });
    await expect(useCase.execute('media-1', 'u-1')).rejects.toThrow(/do not own/);
    expect(r2.deleteObject).not.toHaveBeenCalled();
  });

  it('happy: R2 delete + DB delete (порядок R2 → DB)', async () => {
    const order: string[] = [];
    r2.deleteObject.mockImplementation(async () => { order.push('r2'); });
    mediaRepo.delete.mockImplementation(async () => { order.push('db'); });
    await useCase.execute('media-1', 'u-1');
    expect(order).toEqual(['r2', 'db']);
    expect(r2.deleteObject).toHaveBeenCalledWith('savdo-public', 'product_image/u-1/abc.jpg');
    expect(mediaRepo.delete).toHaveBeenCalledWith('media-1');
  });
});
