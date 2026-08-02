import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export const PARTNER_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const PARTNER_MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — как в UploadDirectUseCase
const DOWNLOAD_TIMEOUT_MS = 15_000;

// Базовая анти-SSRF проверка: https обеспечен DTO, здесь режем локальные/
// приватные хосты. Партнёр аутентифицирован ключом (ключи выдаём вручную),
// поэтому полный DNS-resolve не делаем — это barrier против очевидного абьюза.
export function assertSafePartnerImageUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      `Invalid image URL: ${raw}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  const host = url.hostname.toLowerCase();
  const isIpLiteral = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':');
  if (
    isIpLiteral ||
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      'Image URL must point to a public hostname',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  return url;
}

export async function downloadPartnerImage(rawUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const url = assertSafePartnerImageUrl(rawUrl);

  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      redirect: 'follow',
    });
  } catch (err) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      `Image download failed: ${rawUrl} (${err instanceof Error ? err.message : 'network error'})`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  if (!res.ok) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      `Image download failed: ${rawUrl} (HTTP ${res.status})`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  const mimeType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!PARTNER_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      `Unsupported image type '${mimeType}' at ${rawUrl} — use image/jpeg, image/png or image/webp`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0 || buffer.length > PARTNER_MAX_IMAGE_BYTES) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      `Image at ${rawUrl} is empty or exceeds 10 MB`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  return { buffer, mimeType };
}
