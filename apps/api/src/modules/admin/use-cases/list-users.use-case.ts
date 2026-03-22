import { Injectable } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';
import { ListUsersDto } from '../dto/list-users.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly adminRepo: AdminRepository) {}

  async execute(dto: ListUsersDto) {
    return this.adminRepo.findUsers({
      role: dto.role,
      status: dto.status,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
