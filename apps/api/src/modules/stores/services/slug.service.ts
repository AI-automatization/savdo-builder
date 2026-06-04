import { Injectable } from '@nestjs/common';
import { StoresRepository } from '../repositories/stores.repository';

export interface SlugGenerateOptions {
  /** Максимальная длина результата. По умолчанию 60 (исторический контракт SlugService — НЕ менять для stores). */
  maxLength?: number;
  /** Что вернуть если после санитизации остаётся пустая строка. По умолчанию 'store'. */
  fallback?: string;
}

/**
 * SlugService — единая реализация slugify для backend (DUP-003).
 *
 * Канонический контракт `generate(name)`:
 *   - lower-case
 *   - пробелы → `-`
 *   - всё, что не `[a-z0-9-]` — выкидывается (НЕТ транслитерации кириллицы)
 *   - сжатие `--+` → `-`
 *   - срез ведущих/завершающих `-`
 *   - обрезка до `maxLength` (по умолчанию 60)
 *   - если результат пуст — `fallback` (по умолчанию `'store'`)
 *
 * ⚠️ Менять regex/дефолты **запрещено** — поломаются существующие slug в БД.
 *
 * Использование:
 *   slugService.generate('My Store')                          → 'my-store'
 *   slugService.generate('Электроника')                       → 'store' (fallback)
 *   slugService.generate('Phones', { maxLength: 80, fallback: 'category' })
 */
@Injectable()
export class SlugService {
  constructor(private readonly storesRepo: StoresRepository) {}

  generate(name: string, opts: SlugGenerateOptions = {}): string {
    const maxLength = opts.maxLength ?? 60;
    const fallback = opts.fallback ?? 'store';
    return (
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, maxLength) || fallback
    );
  }

  async generateUnique(name: string): Promise<string> {
    let slug = this.generate(name);
    let attempt = 0;

    while (await this.storesRepo.existsBySlug(slug)) {
      attempt++;
      slug = `${this.generate(name)}-${attempt}`;
    }

    return slug;
  }
}
