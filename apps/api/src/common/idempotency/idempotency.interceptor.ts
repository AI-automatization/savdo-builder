import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { IDEMPOTENT_KEY } from './idempotent.decorator';
import { IdempotencyService } from './idempotency.service';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

const IDEMPOTENCY_HEADER = 'idempotency-key';
const MAX_KEY_LENGTH = 128;
const KEY_PATTERN = /^[A-Za-z0-9_\-:.]{8,128}$/;

/**
 * Idempotency-Key middleware (Stripe-style).
 *
 * Поведение:
 *   1. Если handler не помечен @Idempotent() — пропускаем.
 *   2. Если header отсутствует — выполняем handler как обычно (legacy compat).
 *   3. Если header есть, но формат невалидный — 400 VALIDATION_ERROR.
 *   4. Если ключ найден в Redis с готовым ответом — возвращаем его.
 *   5. Если ключ занят (другой in-flight запрос) — 409 CONFLICT.
 *   6. Иначе acquire lock → выполнить handler → сохранить response (24h TTL).
 *
 * Errors НЕ кэшируются: повторный ретрай после 500/422 должен пройти заново.
 * Это согласовано с Stripe-практикой (cache только success-responses).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isIdempotent) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const rawHeader = request.headers[IDEMPOTENCY_HEADER];
    const idempotencyKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    // No header → legacy clients продолжают работать без idempotency-защиты.
    if (!idempotencyKey) return next.handle();

    if (idempotencyKey.length > MAX_KEY_LENGTH || !KEY_PATTERN.test(idempotencyKey)) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Idempotency-Key must be 8-128 chars, alphanumeric with - _ : . separators',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userId = (request as Request & { user?: { sub?: string } }).user?.sub;
    if (!userId) {
      // @Idempotent должен идти после @UseGuards(JwtAuthGuard). Если sub нет —
      // конфигурация сломана, лучше упасть явно чем кэшировать на anonymous.
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Idempotency-Key requires authenticated user',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const route = `${request.method}:${request.route?.path ?? request.url.split('?')[0]}`;
    const cacheKey = this.idempotencyService.buildCacheKey(idempotencyKey, userId, route);

    return from(this.idempotencyService.getCached(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          this.logger.log(`Idempotency hit: ${route} key=${idempotencyKey.slice(0, 8)}...`);
          context.switchToHttp().getResponse().status(cached.status);
          return of(cached.body);
        }

        return from(this.idempotencyService.acquireLock(cacheKey)).pipe(
          switchMap((acquired) => {
            if (!acquired) {
              throw new DomainException(
                ErrorCode.CONFLICT,
                'A request with this Idempotency-Key is already in progress',
                HttpStatus.CONFLICT,
              );
            }

            return next.handle().pipe(
              tap({
                next: async (body) => {
                  // Только success-responses (не Errors). Status извлекаем из
                  // response — handler мог поставить @HttpCode(201).
                  const response = context.switchToHttp().getResponse();
                  const status = response.statusCode ?? 200;
                  await this.idempotencyService.storeResponse(cacheKey, { status, body });
                },
                error: async (err) => {
                  // Не кэшируем ошибки — клиент может корректно ретраить
                  // после исправления (например, если 422 был из-за невалидного
                  // адреса, повторный запрос с тем же ключом должен пройти).
                  await this.idempotencyService.releaseLock(cacheKey);
                  // HttpException и так пробросится — просто чистим lock.
                  if (!(err instanceof HttpException)) {
                    this.logger.error(`Idempotent handler crashed: ${(err as Error).message}`);
                  }
                },
              }),
            );
          }),
        );
      }),
    );
  }
}
