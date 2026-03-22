import { Injectable } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { ListStoresDto } from '../dto/list-stores.dto';

@Injectable()
export class ListStoresUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  async execute(dto: ListStoresDto) {
    return this.adminRepo.findStores({
      status: dto.status,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
