import { Injectable } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { ListSellersDto } from '../dto/list-sellers.dto';

@Injectable()
export class ListSellersUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  async execute(dto: ListSellersDto) {
    return this.adminRepo.findSellers({
      verificationStatus: dto.verificationStatus,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
