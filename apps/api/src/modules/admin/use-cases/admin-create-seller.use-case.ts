import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRole, SellerVerificationStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface AdminCreateSellerInput {
  userId: string;
  fullName: string;
  sellerType: 'individual' | 'business';
  telegramUsername: string;
}

@Injectable()
export class AdminCreateSellerUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: AdminCreateSellerInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      include: { seller: true },
    });

    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    if (user.seller) {
      throw new DomainException(
        ErrorCode.CONFLICT,
        'User already has a seller profile',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.$transaction(async (db) => {
      const seller = await db.seller.create({
        data: {
          userId: input.userId,
          fullName: input.fullName,
          sellerType: input.sellerType,
          telegramUsername: input.telegramUsername,
          verificationStatus: SellerVerificationStatus.VERIFIED, // admin-created = auto verified
        },
        include: { user: true },
      });

      // Upgrade user role to SELLER
      await db.user.update({
        where: { id: input.userId },
        data: { role: UserRole.SELLER },
      });

      return seller;
    });
  }
}
