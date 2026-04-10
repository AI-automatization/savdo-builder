import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TokenService } from '../../auth/services/token.service';
import { AuthRepository } from '../../auth/repositories/auth.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class ApplySellerUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly authRepo: AuthRepository,
  ) {}

  // BUYER вызывает этот метод чтобы стать SELLER.
  // Создаёт Seller запись, меняет role, возвращает новые токены.
  async execute(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    if (user.role === 'SELLER') {
      throw new DomainException(
        ErrorCode.STORE_ALREADY_EXISTS,
        'User is already a seller',
        HttpStatus.CONFLICT,
      );
    }

    const existingSeller = await this.prisma.seller.findUnique({ where: { userId } });
    if (existingSeller) {
      throw new DomainException(
        ErrorCode.STORE_ALREADY_EXISTS,
        'Seller profile already exists',
        HttpStatus.CONFLICT,
      );
    }

    // Атомарная транзакция: Seller + смена роли
    const [, updatedUser] = await this.prisma.$transaction([
      this.prisma.seller.create({
        data: {
          userId,
          fullName: '',
          sellerType: 'individual',
          telegramUsername: '',
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: 'SELLER' },
      }),
    ]);

    // Инвалидируем все старые сессии (роль изменилась — старые токены неверны)
    await this.prisma.userSession.deleteMany({ where: { userId } });

    // Создаём новую сессию с ролью SELLER
    const { randomUUID } = await import('crypto');
    const sessionId = randomUUID();
    const rawToken = this.tokenService.generateRefreshToken();
    const refreshToken = `${sessionId}.${rawToken}`;
    const refreshTokenHash = await this.tokenService.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const session = await this.authRepo.createSession({
      id: sessionId,
      userId,
      refreshTokenHash,
      expiresAt,
    });

    const accessToken = this.tokenService.generateAccessToken({
      sub: userId,
      role: updatedUser.role,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    };
  }
}
