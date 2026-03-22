import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class GetSellerDetailUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  async execute(sellerId: string) {
    const seller = await this.adminRepo.findSellerById(sellerId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }
    return seller;
  }
}
