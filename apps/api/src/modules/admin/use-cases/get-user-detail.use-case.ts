import { Injectable, HttpStatus } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class GetUserDetailUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  async execute(userId: string) {
    const user = await this.adminRepo.findUserById(userId);
    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
