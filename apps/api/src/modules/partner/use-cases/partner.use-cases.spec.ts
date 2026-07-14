import { ProductStatus } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { PartnerCreateProductUseCase } from './partner-create-product.use-case';
import { PartnerApiKeyGuard, PartnerContext, sha256Hex } from '../guards/partner-api-key.guard';
import { ExecutionContext } from '@nestjs/common';

// ─── helpers ─────────────────────────────────────────────────────────────────

const CTX: PartnerContext = {
  keyId: 'key-1',
  keyName: 'RAOS',
  storeId: 'store-1',
  storeSlug: 'test-store',
  sellerId: 'seller-1',
  sellerUserId: 'user-1',
};

function mockFetchImage(ok = true, mime = 'image/jpeg') {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    headers: { get: () => mime },
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  });
}

function makeUseCase() {
  const createProduct = { execute: jest.fn().mockResolvedValue({ id: 'p-1', status: ProductStatus.DRAFT, title: 'T' }) };
  const changeStatus = { execute: jest.fn().mockResolvedValue({ id: 'p-1', status: ProductStatus.ACTIVE, title: 'T' }) };
  const imagesRepo = { create: jest.fn().mockResolvedValue({ id: 'img-1' }) };
  const uploadDirect = { execute: jest.fn().mockResolvedValue({ mediaFileId: 'm-1', url: 'https://cdn/x.jpg' }) };
  const useCase = new PartnerCreateProductUseCase(
    createProduct as any,
    changeStatus as any,
    imagesRepo as any,
    uploadDirect as any,
  );
  return { useCase, createProduct, changeStatus, imagesRepo, uploadDirect };
}

const BASE_DTO = {
  title: 'Test product',
  basePrice: 100_000,
  imageUrls: ['https://raos.example.com/img.jpg'],
};

// ─── PartnerCreateProductUseCase ────────────────────────────────────────────

describe('PartnerCreateProductUseCase', () => {
  afterEach(() => jest.restoreAllMocks());

  it('создаёт товар, привязывает фото и публикует (DRAFT→ACTIVE)', async () => {
    global.fetch = mockFetchImage() as any;
    const { useCase, createProduct, changeStatus, imagesRepo } = makeUseCase();

    const res = await useCase.execute(CTX, BASE_DTO as any);

    expect(createProduct.execute).toHaveBeenCalledWith('store-1', expect.objectContaining({ title: 'Test product' }));
    expect(imagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p-1', mediaId: 'm-1', isPrimary: true }),
    );
    expect(changeStatus.execute).toHaveBeenCalledWith('p-1', 'store-1', ProductStatus.ACTIVE);
    expect(res.product.status).toBe(ProductStatus.ACTIVE);
    expect(res.imageCount).toBe(1);
  });

  it('publish=false — оставляет DRAFT, статус не меняется', async () => {
    global.fetch = mockFetchImage() as any;
    const { useCase, changeStatus } = makeUseCase();

    const res = await useCase.execute(CTX, { ...BASE_DTO, publish: false } as any);

    expect(changeStatus.execute).not.toHaveBeenCalled();
    expect(res.product.status).toBe(ProductStatus.DRAFT);
  });

  it('фото не скачалось (HTTP 404) — товар НЕ создаётся (faqat rasmi bor)', async () => {
    global.fetch = mockFetchImage(false) as any;
    const { useCase, createProduct } = makeUseCase();

    await expect(useCase.execute(CTX, BASE_DTO as any)).rejects.toThrow(DomainException);
    expect(createProduct.execute).not.toHaveBeenCalled();
  });

  it('не-image content-type — reject до создания товара', async () => {
    global.fetch = mockFetchImage(true, 'text/html') as any;
    const { useCase, createProduct } = makeUseCase();

    await expect(useCase.execute(CTX, BASE_DTO as any)).rejects.toThrow(DomainException);
    expect(createProduct.execute).not.toHaveBeenCalled();
  });

  it('localhost/private URL — reject (анти-SSRF)', async () => {
    const { useCase, createProduct } = makeUseCase();

    await expect(
      useCase.execute(CTX, { ...BASE_DTO, imageUrls: ['https://localhost/x.jpg'] } as any),
    ).rejects.toThrow(DomainException);
    await expect(
      useCase.execute(CTX, { ...BASE_DTO, imageUrls: ['https://192.168.1.1/x.jpg'] } as any),
    ).rejects.toThrow(DomainException);
    expect(createProduct.execute).not.toHaveBeenCalled();
  });

  it('R2 недоступен (0 фото прикрепилось) — 502, товар остаётся DRAFT', async () => {
    global.fetch = mockFetchImage() as any;
    const { useCase, uploadDirect, changeStatus } = makeUseCase();
    uploadDirect.execute.mockRejectedValue(new Error('R2 down'));

    await expect(useCase.execute(CTX, BASE_DTO as any)).rejects.toThrow(DomainException);
    expect(changeStatus.execute).not.toHaveBeenCalled();
  });
});

// ─── PartnerApiKeyGuard ─────────────────────────────────────────────────────

function makeGuardContext(headers: Record<string, string>) {
  const req: any = { header: (n: string) => headers[n.toLowerCase()], partnerContext: undefined };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { ctx, req };
}

describe('PartnerApiKeyGuard', () => {
  const rawKey = 'msk_0123456789abcdef0123456789abcdef01234567';

  function makeGuard(found: any) {
    const keysRepo = {
      findActiveByHash: jest.fn().mockResolvedValue(found),
      touchLastUsed: jest.fn().mockResolvedValue(undefined),
    };
    return { guard: new PartnerApiKeyGuard(keysRepo as any), keysRepo };
  }

  const KEY_ROW = {
    id: 'key-1',
    name: 'RAOS',
    store: { id: 'store-1', slug: 'test-store', seller: { id: 'seller-1', userId: 'user-1', isBlocked: false } },
  };

  it('валидный ключ — пропускает и кладёт partnerContext', async () => {
    const { guard, keysRepo } = makeGuard(KEY_ROW);
    const { ctx, req } = makeGuardContext({ 'x-api-key': rawKey });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(keysRepo.findActiveByHash).toHaveBeenCalledWith(sha256Hex(rawKey));
    expect(req.partnerContext).toEqual(
      expect.objectContaining({ storeId: 'store-1', sellerUserId: 'user-1' }),
    );
  });

  it('нет заголовка — 401', async () => {
    const { guard } = makeGuard(KEY_ROW);
    const { ctx } = makeGuardContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(DomainException);
  });

  it('ключ не найден/отозван — 401', async () => {
    const { guard } = makeGuard(null);
    const { ctx } = makeGuardContext({ 'x-api-key': rawKey });
    await expect(guard.canActivate(ctx)).rejects.toThrow(DomainException);
  });

  it('продавец заблокирован — 401', async () => {
    const { guard } = makeGuard({
      ...KEY_ROW,
      store: { ...KEY_ROW.store, seller: { ...KEY_ROW.store.seller, isBlocked: true } },
    });
    const { ctx } = makeGuardContext({ 'x-api-key': rawKey });
    await expect(guard.canActivate(ctx)).rejects.toThrow(DomainException);
  });
});
