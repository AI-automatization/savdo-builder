import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { status: true },
    });

    if (!user) {
      this.logger.warn(`JWT rejected: user not found [sub=${payload.sub}]`);
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Account not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === 'BLOCKED') {
      this.logger.warn(`JWT rejected: user BLOCKED [sub=${payload.sub}]`);
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Account is blocked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Проверяем что сессия ещё существует в БД.
    // Гарантирует немедленную инвалидацию токена после logout.
    // Запрос по PRIMARY KEY (id) — один B-tree lookup, ~1ms.
    if (payload.sessionId) {
      const session = await this.prisma.userSession.findUnique({
        where: { id: payload.sessionId },
        select: { id: true, expiresAt: true },
      });

      if (!session || session.expiresAt < new Date()) {
        this.logger.warn(
          `JWT rejected: session not found/expired [sub=${payload.sub}, sid=${payload.sessionId}]`,
        );
        throw new DomainException(
          ErrorCode.UNAUTHORIZED,
          'Session expired. Please log in again.',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    return payload;
  }
}
