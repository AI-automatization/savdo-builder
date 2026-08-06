import { ProductStatus } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { PartnerCreateProductUseCase } from './partner-create-product.use-case';
import { PartnerUpdateProductUseCase } from './partner-update-product.use-case';
import { PartnerUpdateStockUseCase } from './partner-update-stock.use-case';
import { PartnerDeleteProductUseCase } from './partner-delete-product.use-case';
import { PartnerApiKeyGuard, PartnerContext, sha256Hex } from '../guards/partner-api-key.guard';
import { downloadPartnerImage } from '../utils/partner-image.util';
import { lookup } from 'node:dns/promises';
import { ExecutionContext } from '@nestjs/common';

// DNS не ходит в сеть из тестов: по умолчанию любой хост резолвится в публичный
// адрес, отдельные тесты переопределяют (редирект на 169.254.169.254 и т.п.).
jest.mock('node:dns/promises', () => ({
  lookup: jest.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));
const dnsLookup = lookup as unknown as jest.Mock;

// ─── helpers ─────────────────────────────────────────────────────────────────

const CTX: PartnerContext = {
  keyId: 'key-1',
  keyName: 'RAOS',
  storeId: 'store-1',
  storeSlug: 'test-store',
  sellerId: 'seller-1',
  sellerUserId: 'user-1',
};

/** Ответ-заглушка для fetch: тело отдаётся стримом, как у настоящего Response. */
type ImageResponseOpts = {
  ok?: boolean;
  status?: number;
  mime?: string;
  contentLength?: string | null;
  location?: string | null;
  chunks?: Uint8Array[] | AsyncIterable<Uint8Array>;
};

function imageResponse(opts: ImageResponseOpts = {}) {
  const ok = opts.ok ?? true;
  const status = opts.status ?? (ok ? 200 : 404);
  const mime = opts.mime ?? 'image/jpeg';
  const chunks = opts.chunks ?? [new Uint8Array([1, 2, 3])];
  const headers: Record<string, string | null> = {
    'content-type': mime,
    'content-length': opts.contentLength ?? null,
    location: opts.location ?? null,
  };
  const body = Symbol.asyncIterator in Object(chunks)
    ? (chunks as AsyncIterable<Uint8Array>)
    : (async function* () {
        for (const c of chunks as Uint8Array[]) yield c;
      })();
  return {
    ok,
    status,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
    body: Object.assign(body, { cancel: async () => undefined }),
  };
}

function mockFetchImage(ok = true, mime = 'image/jpeg') {
  return jest.fn().mockResolvedValue(imageResponse({ ok, mime }));
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

// ─── PartnerUpdateProductUseCase ────────────────────────────────────────────

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-1',
    storeId: 'store-1',
    title: 'Old title',
    status: ProductStatus.DRAFT,
    hasVariants: false,
    totalStock: 5,
    images: [{ id: 'img-old', isPrimary: true, sortOrder: 0 }],
    ...overrides,
  };
}

function makeUpdateUseCase(product: Record<string, unknown> | null) {
  const productsRepo = {
    findById: jest.fn().mockResolvedValue(product),
    setTotalStock: jest.fn().mockImplementation((id, stock) => Promise.resolve({ id, totalStock: stock })),
  };
  const updateProduct = { execute: jest.fn().mockResolvedValue({ id: 'p-1', title: 'New title', status: ProductStatus.DRAFT }) };
  const changeStatus = { execute: jest.fn().mockImplementation((id, _storeId, status) => Promise.resolve({ id, status })) };
  const imagesRepo = {
    clearPrimary: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ id: 'img-new' }),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const uploadDirect = { execute: jest.fn().mockResolvedValue({ mediaFileId: 'm-2', url: 'https://cdn/y.jpg' }) };
  const useCase = new PartnerUpdateProductUseCase(
    productsRepo as any,
    updateProduct as any,
    changeStatus as any,
    imagesRepo as any,
    uploadDirect as any,
  );
  return { useCase, productsRepo, updateProduct, changeStatus, imagesRepo, uploadDirect };
}

describe('PartnerUpdateProductUseCase', () => {
  afterEach(() => jest.restoreAllMocks());

  it('товар не найден — 404', async () => {
    const { useCase } = makeUpdateUseCase(null);
    await expect(useCase.execute(CTX, 'p-1', { name: 'X' })).rejects.toThrow(DomainException);
  });

  it('чужой магазин — 403', async () => {
    const { useCase } = makeUpdateUseCase(makeProduct({ storeId: 'other-store' }));
    await expect(useCase.execute(CTX, 'p-1', { name: 'X' })).rejects.toThrow(DomainException);
  });

  it('name/price/description — делегирует UpdateProductUseCase', async () => {
    const { useCase, updateProduct } = makeUpdateUseCase(makeProduct());
    await useCase.execute(CTX, 'p-1', { name: 'New title', price: 200_000 });
    expect(updateProduct.execute).toHaveBeenCalledWith('p-1', 'store-1', {
      title: 'New title',
      basePrice: 200_000,
      description: undefined,
    });
  });

  it('пустой payload — UpdateProductUseCase не вызывается', async () => {
    const { useCase, updateProduct } = makeUpdateUseCase(makeProduct());
    await useCase.execute(CTX, 'p-1', {});
    expect(updateProduct.execute).not.toHaveBeenCalled();
  });

  it('isActive=true на DRAFT — публикует (ACTIVE)', async () => {
    const { useCase, changeStatus } = makeUpdateUseCase(makeProduct({ status: ProductStatus.DRAFT }));
    await useCase.execute(CTX, 'p-1', { isActive: true });
    expect(changeStatus.execute).toHaveBeenCalledWith('p-1', 'store-1', ProductStatus.ACTIVE);
  });

  it('isActive=true на уже ACTIVE — no-op (идемпотентно)', async () => {
    const { useCase, changeStatus } = makeUpdateUseCase(makeProduct({ status: ProductStatus.ACTIVE }));
    await useCase.execute(CTX, 'p-1', { isActive: true });
    expect(changeStatus.execute).not.toHaveBeenCalled();
  });

  it('isActive=false на ACTIVE — архивирует', async () => {
    const { useCase, changeStatus } = makeUpdateUseCase(makeProduct({ status: ProductStatus.ACTIVE }));
    await useCase.execute(CTX, 'p-1', { isActive: false });
    expect(changeStatus.execute).toHaveBeenCalledWith('p-1', 'store-1', ProductStatus.ARCHIVED);
  });

  it('isActive=false на DRAFT — no-op, не пытается архивировать черновик', async () => {
    const { useCase, changeStatus } = makeUpdateUseCase(makeProduct({ status: ProductStatus.DRAFT }));
    await useCase.execute(CTX, 'p-1', { isActive: false });
    expect(changeStatus.execute).not.toHaveBeenCalled();
  });

  it('imageUrl — скачивает, грузит, снимает старую обложку и ставит новую', async () => {
    global.fetch = mockFetchImage() as any;
    const { useCase, imagesRepo, uploadDirect } = makeUpdateUseCase(makeProduct());

    await useCase.execute(CTX, 'p-1', { imageUrl: 'https://raos.example.com/new.jpg' });

    expect(uploadDirect.execute).toHaveBeenCalled();
    expect(imagesRepo.clearPrimary).toHaveBeenCalledWith('p-1');
    expect(imagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p-1', mediaId: 'm-2', isPrimary: true, sortOrder: 0 }),
    );
    expect(imagesRepo.delete).toHaveBeenCalledWith('p-1', 'img-old');
  });
});

// ─── PartnerUpdateStockUseCase ──────────────────────────────────────────────

describe('PartnerUpdateStockUseCase', () => {
  function makeStockUseCase(product: Record<string, unknown> | null) {
    const productsRepo = {
      findById: jest.fn().mockResolvedValue(product),
      setTotalStock: jest.fn().mockImplementation((id, stock) => Promise.resolve({ id, totalStock: stock })),
    };
    return { useCase: new PartnerUpdateStockUseCase(productsRepo as any), productsRepo };
  }

  it('товар не найден — 404', async () => {
    const { useCase } = makeStockUseCase(null);
    await expect(useCase.execute(CTX, 'p-1', 10)).rejects.toThrow(DomainException);
  });

  it('чужой магазин — 403', async () => {
    const { useCase } = makeStockUseCase(makeProduct({ storeId: 'other-store' }));
    await expect(useCase.execute(CTX, 'p-1', 10)).rejects.toThrow(DomainException);
  });

  it('hasVariants=true — отклоняет (сток per-variant, не через partner API)', async () => {
    const { useCase } = makeStockUseCase(makeProduct({ hasVariants: true }));
    await expect(useCase.execute(CTX, 'p-1', 10)).rejects.toThrow(DomainException);
  });

  it('single-SKU товар — пишет totalStock напрямую', async () => {
    const { useCase, productsRepo } = makeStockUseCase(makeProduct());
    const res = await useCase.execute(CTX, 'p-1', 42);
    expect(productsRepo.setTotalStock).toHaveBeenCalledWith('p-1', 42);
    expect(res.totalStock).toBe(42);
  });
});

// ─── PartnerDeleteProductUseCase ────────────────────────────────────────────

describe('PartnerDeleteProductUseCase', () => {
  function makeDeleteUseCase(product: Record<string, unknown> | null) {
    const productsRepo = {
      findById: jest.fn().mockResolvedValue(product),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const changeStatus = { execute: jest.fn().mockResolvedValue({ id: 'p-1', status: ProductStatus.ARCHIVED }) };
    return { useCase: new PartnerDeleteProductUseCase(productsRepo as any, changeStatus as any), productsRepo, changeStatus };
  }

  it('товар не найден — 404', async () => {
    const { useCase } = makeDeleteUseCase(null);
    await expect(useCase.execute(CTX, 'p-1')).rejects.toThrow(DomainException);
  });

  it('чужой магазин — 403', async () => {
    const { useCase } = makeDeleteUseCase(makeProduct({ storeId: 'other-store' }));
    await expect(useCase.execute(CTX, 'p-1')).rejects.toThrow(DomainException);
  });

  it('ACTIVE — сначала архивирует, потом удаляет', async () => {
    const { useCase, productsRepo, changeStatus } = makeDeleteUseCase(makeProduct({ status: ProductStatus.ACTIVE }));
    await useCase.execute(CTX, 'p-1');
    expect(changeStatus.execute).toHaveBeenCalledWith('p-1', 'store-1', ProductStatus.ARCHIVED);
    expect(productsRepo.delete).toHaveBeenCalledWith('p-1');
  });

  it('DRAFT — удаляет напрямую, без архивации', async () => {
    const { useCase, productsRepo, changeStatus } = makeDeleteUseCase(makeProduct({ status: ProductStatus.DRAFT }));
    await useCase.execute(CTX, 'p-1');
    expect(changeStatus.execute).not.toHaveBeenCalled();
    expect(productsRepo.delete).toHaveBeenCalledWith('p-1');
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

// ─── downloadPartnerImage: SSRF + OOM (issue #9) ────────────────────────────

describe('downloadPartnerImage — анти-SSRF и лимит тела', () => {
  const PUBLIC_URL = 'https://public.example/a.png';

  beforeEach(() => {
    dnsLookup.mockReset();
    dnsLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });
  afterEach(() => jest.restoreAllMocks());

  it('отклоняет редирект на приватный адрес (cloud metadata)', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        imageResponse({ status: 302, location: 'https://169.254.169.254/latest/meta-data/' }),
      )
      .mockResolvedValueOnce(imageResponse({ mime: 'image/png' }));
    global.fetch = fetchMock as any;

    await expect(downloadPartnerImage(PUBLIC_URL)).rejects.toThrow(/public address/);
    // второй запрос не должен случиться: цель редиректа зарезана до fetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('отклоняет редирект на хост, который резолвится в приватный IP', async () => {
    dnsLookup
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
      .mockResolvedValueOnce([{ address: '10.0.0.7', family: 4 }]);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(imageResponse({ status: 302, location: 'https://evil.example/i' }));
    global.fetch = fetchMock as any;

    await expect(downloadPartnerImage(PUBLIC_URL)).rejects.toThrow(/public address/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('отклоняет тело больше 10 МБ без Content-Length (стриминг, не OOM)', async () => {
    const chunk = new Uint8Array(1024 * 1024); // 1 МБ
    let produced = 0;
    async function* endless() {
      // Если лимит не сработает, генератор уйдёт в бесконечность — тест это ловит.
      while (produced < 64) {
        produced++;
        yield chunk;
      }
    }
    global.fetch = jest
      .fn()
      .mockResolvedValue(imageResponse({ mime: 'image/png', chunks: endless() })) as any;

    await expect(downloadPartnerImage(PUBLIC_URL)).rejects.toThrow(/10 MB/);
    // потолок 10 МБ: прочитали 11 чанков и оборвались, а не 64
    expect(produced).toBeLessThanOrEqual(12);
  });

  it('отклоняет по Content-Length ДО чтения тела', async () => {
    const body = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (n: string) =>
          ({ 'content-type': 'image/png', 'content-length': String(50 * 1024 * 1024) })[
            n.toLowerCase()
          ] ?? null,
      },
      get body() {
        body();
        return null;
      },
    }) as any;

    await expect(downloadPartnerImage(PUBLIC_URL)).rejects.toThrow(/10 MB/);
    expect(body).not.toHaveBeenCalled();
  });

  it('обрывает цепочку редиректов после MAX_REDIRECTS', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(imageResponse({ status: 302, location: 'https://public.example/next' })) as any;

    await expect(downloadPartnerImage(PUBLIC_URL)).rejects.toThrow(/too many redirects/);
  });

  it('отклоняет http (не https) и хост без A-записи', async () => {
    global.fetch = jest.fn() as any;
    await expect(downloadPartnerImage('http://public.example/a.png')).rejects.toThrow(/https/);

    dnsLookup.mockResolvedValue([]);
    await expect(downloadPartnerImage(PUBLIC_URL)).rejects.toThrow(/public address/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('успешный путь: возвращает буфер и mime', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(imageResponse({ mime: 'image/webp', chunks: [new Uint8Array([1, 2, 3, 4])] })) as any;

    const res = await downloadPartnerImage(PUBLIC_URL);
    expect(res.mimeType).toBe('image/webp');
    expect(res.buffer.length).toBe(4);
  });
});
