import { HttpStatus } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export const PARTNER_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const PARTNER_MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — как в UploadDirectUseCase
const DOWNLOAD_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

function invalidUrl(message: string): DomainException {
  return new DomainException(ErrorCode.VALIDATION_ERROR, message, HttpStatus.UNPROCESSABLE_ENTITY);
}

/**
 * RFC1918 + loopback + link-local (включая 169.254.169.254 — cloud metadata)
 * + CGNAT + IPv6 ULA/loopback/link-local.
 */
export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    return v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
  }
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

// Дешёвый строковый барьер: очевидно-локальные имена отсекаем без резолва.
// Полную проверку делает assertPublicHost — она же покрывает IP-литералы.
export function assertSafePartnerImageUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw invalidUrl(`Invalid image URL: ${raw}`);
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw invalidUrl('Image URL must point to a public hostname');
  }
  return url;
}

/**
 * Резолвим хост и проверяем РЕАЛЬНЫЙ адрес — строкового чёрного списка мало
 * (`nip.io`, CNAME на внутренний хост, любой домен с A-записью 10.x).
 * Вызывается на КАЖДОМ хопе редиректа: без этого `redirect: 'follow'`
 * обесценивал проверку исходного URL (302 → 169.254.169.254 отдавал
 * нашему контейнеру cloud-metadata).
 */
export async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== 'https:') {
    throw invalidUrl('Image URL must use https');
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const addrs = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => [] as { address: string }[]);
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw invalidUrl('Image URL must resolve to a public address');
  }
}

export async function downloadPartnerImage(
  rawUrl: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  let url = assertSafePartnerImageUrl(rawUrl);
  // Один сигнал на всю операцию, включая чтение тела: иначе таймаут
  // перезапускался бы на каждом хопе и на стриминге.
  const signal = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);

  let res: Response;
  for (let hop = 0; ; hop++) {
    await assertPublicHost(url);

    try {
      // manual, не follow: цель редиректа обязана пройти ту же проверку.
      res = await fetch(url, { signal, redirect: 'manual' });
    } catch (err) {
      throw invalidUrl(
        `Image download failed: ${rawUrl} (${err instanceof Error ? err.message : 'network error'})`,
      );
    }

    if (res.status < 300 || res.status >= 400) break;
    if (hop >= MAX_REDIRECTS) {
      throw invalidUrl(`Image download failed: ${rawUrl} (too many redirects)`);
    }
    const loc = res.headers.get('location');
    if (!loc) break;
    try {
      url = new URL(loc, url);
    } catch {
      throw invalidUrl(`Image download failed: ${rawUrl} (invalid redirect target)`);
    }
  }

  if (!res.ok) {
    throw invalidUrl(`Image download failed: ${rawUrl} (HTTP ${res.status})`);
  }

  const mimeType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!PARTNER_IMAGE_MIME_TYPES.has(mimeType)) {
    throw invalidUrl(
      `Unsupported image type '${mimeType}' at ${rawUrl} — use image/jpeg, image/png or image/webp`,
    );
  }

  // Отсекаем по заявленному размеру ДО чтения тела...
  const declared = Number(res.headers.get('content-length') ?? NaN);
  if (Number.isFinite(declared) && declared > PARTNER_MAX_IMAGE_BYTES) {
    throw invalidUrl(`Image at ${rawUrl} exceeds 10 MB`);
  }

  // ...и стримим с жёстким потолком — Content-Length может врать или отсутствовать.
  // Раньше здесь был res.arrayBuffer(): бесконечный поток съедал heap до OOM,
  // а проверка длины не срабатывала никогда, потому что до неё не доходило.
  const buffer = await readCappedBody(res, rawUrl);
  if (buffer.length === 0) {
    throw invalidUrl(`Image at ${rawUrl} is empty`);
  }

  return { buffer, mimeType };
}

async function readCappedBody(res: Response, rawUrl: string): Promise<Buffer> {
  const body = res.body as unknown as AsyncIterable<Uint8Array> | null;
  if (!body || typeof body[Symbol.asyncIterator] !== 'function') {
    throw invalidUrl(`Image at ${rawUrl} is empty`);
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.length;
    if (total > PARTNER_MAX_IMAGE_BYTES) {
      // Рвём соединение, чтобы отправитель не продолжал лить в никуда.
      await res.body?.cancel?.().catch(() => undefined);
      throw invalidUrl(`Image at ${rawUrl} exceeds 10 MB`);
    }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks, total);
}
