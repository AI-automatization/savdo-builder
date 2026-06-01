/**
 * Pagination helpers для Prisma queries.
 * Раньше блок `const page = filters.page ?? 1; const limit = Math.min(filters.limit ?? 20, 100);
 * const skip = (page - 1) * limit;` копировался в 14+ местах по репозиториям —
 * теперь один helper. См. DRY-аудит 2026-06-01 (DUP-006).
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_LIMIT = 100;

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface NormalizedPagination {
  /** Sanitized page (>=1). */
  page: number;
  /** Sanitized limit clamped to [1, maxLimit]. */
  limit: number;
  /** Prisma `skip`. */
  skip: number;
  /** Prisma `take` (alias of limit). */
  take: number;
}

/**
 * Нормализует page/limit и считает skip для Prisma.
 *
 * @param input              Filters object с (опциональными) page/limit.
 * @param maxLimit           Верхняя граница limit (default 100). Передавай 1000 для analytics.
 */
export function toPrismaPagination(
  input: PaginationInput | undefined,
  maxLimit: number = DEFAULT_MAX_LIMIT,
): NormalizedPagination {
  const page = Math.max(1, input?.page ?? DEFAULT_PAGE);
  const limit = Math.min(Math.max(1, input?.limit ?? DEFAULT_LIMIT), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

/** Pagination meta для ответа клиенту: `{ page, limit, total, totalPages }`. */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): { page: number; limit: number; total: number; totalPages: number } {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
