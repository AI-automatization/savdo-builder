import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodeType } from '../../shared/constants/error-codes';

export class DomainException extends HttpException {
  constructor(
    public readonly code: ErrorCodeType,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ statusCode, code, message, details: details ?? {} }, statusCode);
  }
}
