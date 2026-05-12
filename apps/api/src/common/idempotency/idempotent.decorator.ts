import { SetMetadata } from '@nestjs/common';

/**
 * Метка для `IdempotencyInterceptor`. Применяется на @Post handler'ы где
 * критичен once-only execution: создание заказа, оплата, refund.
 *
 * Клиент шлёт `Idempotency-Key: <uuid>` заголовок; повторный запрос с тем же
 * ключом + тем же userId + endpoint вернёт закэшированный ответ (24h TTL).
 *
 * Если ключа нет — handler выполнится как обычно (defensive, чтобы не сломать
 * legacy clients). В будущем можно сделать строго required.
 */
export const IDEMPOTENT_KEY = 'idempotent';
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
