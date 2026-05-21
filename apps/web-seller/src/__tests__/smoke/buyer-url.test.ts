import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buyerOrigin,
  buyerStoreUrl,
  buyerStoreDisplay,
  buyerHostDisplay,
  buyerProductUrl,
} from '@/lib/buyer-url';

// FRONTEND-SMOKE-PLAYWRIGHT-001 part B — buyer-url helpers (web-seller).
// Защищает контракт `NEXT_PUBLIC_BUYER_URL` → savdo.uz fallback и формат URL.

const ORIGINAL = process.env.NEXT_PUBLIC_BUYER_URL;

describe('buyer-url helpers', () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_BUYER_URL = ORIGINAL;
  });

  describe('buyerOrigin', () => {
    it('возвращает значение env переменной если задана', () => {
      process.env.NEXT_PUBLIC_BUYER_URL = 'https://staging.savdo.uz';
      expect(buyerOrigin()).toBe('https://staging.savdo.uz');
    });

    it('падает на savdo.uz fallback если env пустая', () => {
      process.env.NEXT_PUBLIC_BUYER_URL = '';
      expect(buyerOrigin()).toBe('https://savdo.uz');
    });
  });

  describe('buyerStoreUrl', () => {
    it('собирает url магазина из origin + slug', () => {
      process.env.NEXT_PUBLIC_BUYER_URL = 'https://savdo.uz';
      expect(buyerStoreUrl('nike-uz')).toBe('https://savdo.uz/nike-uz');
    });
  });

  describe('buyerStoreDisplay', () => {
    it('возвращает host+slug без протокола (prod)', () => {
      process.env.NEXT_PUBLIC_BUYER_URL = 'https://savdo.uz';
      expect(buyerStoreDisplay('nike-uz')).toBe('savdo.uz/nike-uz');
    });

    it('сохраняет порт для dev окружения', () => {
      process.env.NEXT_PUBLIC_BUYER_URL = 'http://localhost:3001';
      expect(buyerStoreDisplay('test')).toBe('localhost:3001/test');
    });
  });

  describe('buyerHostDisplay', () => {
    it('возвращает только хост без протокола и без slug', () => {
      process.env.NEXT_PUBLIC_BUYER_URL = 'https://savdo.uz';
      expect(buyerHostDisplay()).toBe('savdo.uz');
    });
  });

  describe('buyerProductUrl', () => {
    it('строит url товара по slug и id', () => {
      process.env.NEXT_PUBLIC_BUYER_URL = 'https://savdo.uz';
      expect(buyerProductUrl('nike-uz', 'p-123')).toBe(
        'https://savdo.uz/nike-uz/products/p-123',
      );
    });
  });
});
