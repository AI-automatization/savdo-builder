import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

interface ProductLike {
  storeId: string;
}

/**
 * Проверка владения продуктом магазином продавца.
 * Раньше блок `if (product.storeId !== storeId) throw FORBIDDEN(...)` копировался
 * в 11+ местах (7 use-cases + 4 контроллера). Теперь — этот helper.
 *
 * Бросает 403 FORBIDDEN с тем же сообщением "Product does not belong to your store"
 * чтобы сохранить контракт ошибки для клиентов.
 *
 * См. DRY-аудит 2026-06-01 (DUP-005).
 *
 * @param product   — объект с полем storeId (продукт из репозитория, не null).
 * @param storeId   — storeId продавца который пытается сделать действие.
 * @throws DomainException(FORBIDDEN) если storeId не совпадают.
 */
export function assertProductOwnership(product: ProductLike, storeId: string): void {
  if (product.storeId !== storeId) {
    throw new DomainException(
      ErrorCode.FORBIDDEN,
      'Product does not belong to your store',
      HttpStatus.FORBIDDEN,
    );
  }
}
