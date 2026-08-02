/**
 * Тесты для `ProductPresenterService` (P3-004 sale computation).
 *
 * Покрытие computeSale + priceFields:
 *   - sale < base → isSale=true, discountPercent корректный
 *   - sale === base → no sale
 *   - sale > base → no sale (sanity)
 *   - sale === 0 → no sale (защита от bad data)
 *   - base === 0 → no sale (защита от division-by-zero)
 *   - null/undefined → no sale
 *   - discountPercent floor (29.5% → 29, 30.5% → 30)
 *   - clamp percent в [1, 99]
 *   - priceFields собирает все 5 полей
 */
import { ProductPresenterService } from './product-presenter.service';
import { PrismaService } from '../../../database/prisma.service';

describe('ProductPresenterService', () => {
  const svc = new ProductPresenterService({} as PrismaService);

  describe('computeSale', () => {
    it('sale < base → isSale=true, % corret', () => {
      expect(svc.computeSale(100, 70)).toEqual({ isSale: true, discountPercent: 30 });
      expect(svc.computeSale(1000, 500)).toEqual({ isSale: true, discountPercent: 50 });
    });

    it('sale === base → no sale', () => {
      expect(svc.computeSale(100, 100)).toEqual({ isSale: false, discountPercent: null });
    });

    it('sale > base → no sale (sanity guard)', () => {
      expect(svc.computeSale(100, 200)).toEqual({ isSale: false, discountPercent: null });
    });

    it('sale = 0 → no sale (защита от bad data)', () => {
      expect(svc.computeSale(100, 0)).toEqual({ isSale: false, discountPercent: null });
    });

    it('base = 0 → no sale (защита от div0)', () => {
      expect(svc.computeSale(0, 50)).toEqual({ isSale: false, discountPercent: null });
    });

    it('null/undefined → no sale', () => {
      expect(svc.computeSale(null, null)).toEqual({ isSale: false, discountPercent: null });
      expect(svc.computeSale(undefined, undefined)).toEqual({ isSale: false, discountPercent: null });
      expect(svc.computeSale(100, null)).toEqual({ isSale: false, discountPercent: null });
      expect(svc.computeSale(null, 50)).toEqual({ isSale: false, discountPercent: null });
    });

    it('floor: 70/200 = 65% (a 200→70 = 65%)', () => {
      expect(svc.computeSale(200, 70)).toEqual({ isSale: true, discountPercent: 65 });
    });

    it('floor: 99.5% case остаётся 99 (clamp)', () => {
      // base=1000 sale=1 → 99.9% floor = 99
      expect(svc.computeSale(1000, 1)).toEqual({ isSale: true, discountPercent: 99 });
    });

    it('Decimal-like (Prisma) → number', () => {
      // имитируем Prisma Decimal через toString
      const baseDecimal = { toString: () => '100' };
      const saleDecimal = { toString: () => '80' };
      expect(svc.computeSale(baseDecimal, saleDecimal)).toEqual({ isSale: true, discountPercent: 20 });
    });

    it('< 1% округление вниз → no sale', () => {
      // base=10000 sale=9999 → 0.01% → floor 0% → no sale
      expect(svc.computeSale(10000, 9999)).toEqual({ isSale: false, discountPercent: null });
    });
  });

  describe('computeStockFields (BUG-2)', () => {
    it('variants present, sum > 0 → totalStock=sum, inStock=true', () => {
      const variants = [{ stockQuantity: 3 }, { stockQuantity: 2 }];
      expect(svc.computeStockFields({ totalStock: 999 }, variants)).toEqual({
        totalStock: 5,
        inStock: true,
      });
    });

    it('variants present, all zero → totalStock=0, inStock=false (denorm ignored)', () => {
      // variant-режим: даже если product.totalStock denorm > 0, доверяем variants.
      const variants = [{ stockQuantity: 0 }, { stockQuantity: 0 }];
      expect(svc.computeStockFields({ totalStock: 50 }, variants)).toEqual({
        totalStock: 0,
        inStock: false,
      });
    });

    it('no variants (single-SKU), product.totalStock > 0 → totalStock=product.totalStock, inStock=true', () => {
      // Root cause BUG-2: раньше sum пустого массива → 0 → витрина OOS.
      expect(svc.computeStockFields({ totalStock: 7 }, [])).toEqual({
        totalStock: 7,
        inStock: true,
      });
    });

    it('no variants, product.totalStock=0 → inStock=false', () => {
      expect(svc.computeStockFields({ totalStock: 0 }, [])).toEqual({
        totalStock: 0,
        inStock: false,
      });
    });

    it('no variants, product.totalStock=null/undefined → 0', () => {
      expect(svc.computeStockFields({ totalStock: null }, [])).toEqual({
        totalStock: 0,
        inStock: false,
      });
      expect(svc.computeStockFields({}, [])).toEqual({
        totalStock: 0,
        inStock: false,
      });
    });

    it('variants with null stockQuantity treated as 0', () => {
      const variants = [{ stockQuantity: null }, { stockQuantity: 5 }];
      expect(svc.computeStockFields({ totalStock: 0 }, variants)).toEqual({
        totalStock: 5,
        inStock: true,
      });
    });
  });

  describe('priceFields', () => {
    it('собирает 5 полей с правильными типами', () => {
      const result = svc.priceFields(100, 120, 70);
      expect(result).toEqual({
        basePrice: 100,
        oldPrice: 120,
        salePrice: 70,
        isSale: true,
        discountPercent: 30,
      });
    });

    it('no oldPrice / salePrice → null + no sale', () => {
      expect(svc.priceFields(100, null, null)).toEqual({
        basePrice: 100,
        oldPrice: null,
        salePrice: null,
        isSale: false,
        discountPercent: null,
      });
    });
  });
});
