import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { ErrorReporter } from '../../shared/error-reporter';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof DomainException) {
      const body = exception.getResponse() as Record<string, unknown>;
      return response.status(exception.getStatus()).json(body);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      // API-SENTRY-001: 5xx HttpException (ServiceUnavailable и т.п.) — тоже инцидент.
      // 4xx — клиентские ошибки, не репортим.
      if (status >= 500) {
        ErrorReporter.captureException(exception, this.requestContext(request));
      }
      return response.status(status).json(
        typeof res === 'object'
          ? res
          : { statusCode: status, code: ErrorCode.INTERNAL_ERROR, message: res },
      );
    }

    // API-SENTRY-001: unhandled exception всегда 500 — репортим в ErrorReporter.
    ErrorReporter.captureException(exception, this.requestContext(request));
    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
      details: {},
    });
  }

  /**
   * Контекст запроса для ErrorReporter. PII-скраббинг (token/secret) делает
   * сам ErrorReporter.scrubPII — здесь только не-чувствительные поля.
   */
  private requestContext(request: Request): Record<string, unknown> {
    // request.user — это JwtPayload (Passport кладёт return из JwtStrategy.validate).
    // userId лежит в `sub`, не в `id`.
    const userId = (request as Request & { user?: { sub?: string } }).user?.sub;
    return {
      source: 'GlobalExceptionFilter',
      method: request?.method,
      path: request?.originalUrl ?? request?.url,
      ...(userId ? { userId } : {}),
    };
  }
}
