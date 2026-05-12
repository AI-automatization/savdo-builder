import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { JwtPayload } from '../decorators/current-user.decorator';
import { SKIP_MFA_KEY } from '../decorators/skip-mfa.decorator';

/**
 * API-MFA-NOT-ENFORCED-001: блокирует все admin endpoints для JWT с mfaPending=true.
 *
 * Применяется к AdminController и SuperAdminController. Endpoints, нужные для
 * прохождения challenge (auth/me, auth/mfa/login, setup, verify, disable),
 * помечаются `@SkipMfaCheck()` декоратором.
 *
 * Гард ставится ПОСЛЕ JwtAuthGuard и RolesGuard в @UseGuards — JwtAuthGuard уже
 * заполнил req.user. Если payload.mfaPending !== true → guard пропускает.
 *
 * Дизайн-решение: проверка идёт по claim в JWT, а не DB-lookup. Это безопасно,
 * потому что JWT подписан секретом, и mfaPending выставляется только в трёх
 * login flows (verify-otp, telegram-auth, refresh-session) — нигде в коде
 * клиент не может его «отменить».
 */
@Injectable()
export class MfaEnforcedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as JwtPayload | undefined;

    if (user?.mfaPending) {
      throw new DomainException(
        ErrorCode.MFA_REQUIRED,
        'Multi-factor authentication required. POST /admin/auth/mfa/login with TOTP code.',
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
