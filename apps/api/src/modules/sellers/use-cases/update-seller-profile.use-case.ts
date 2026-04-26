import { Injectable, HttpStatus } from '@nestjs/common';
import { SellersRepository } from '../repositories/sellers.repository';
import { UsersRepository } from '../../users/repositories/users.repository';
import { TransactionManager } from '../../../database/transaction.manager';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class UpdateSellerProfileUseCase {
  constructor(
    private readonly sellersRepo: SellersRepository,
    private readonly usersRepo: UsersRepository,
    private readonly tx: TransactionManager,
  ) {}

  async execute(userId: string, data: {
    fullName?: string;
    sellerType?: string;
    telegramUsername?: string;
    languageCode?: string;
    telegramNotificationsActive?: boolean;
  }) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    if (seller.isBlocked) {
      throw new DomainException(ErrorCode.SELLER_BLOCKED, 'Seller is blocked', HttpStatus.FORBIDDEN);
    }

    const { languageCode, ...sellerData } = data;

    return this.tx.run(async (db) => {
      const updatedSeller = await db.seller.update({
        where: { id: seller.id },
        data: sellerData,
        include: { user: true },
      });

      if (languageCode) {
        await db.user.update({
          where: { id: userId },
          data: { languageCode },
        });
      }

      return updatedSeller;
    });
  }
}
