import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { seller: true, buyer: true, admin: true },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { seller: true, buyer: true },
    });
  }

  async updateLanguage(userId: string, languageCode: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { languageCode },
    });
  }

  async blockUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' },
    });
  }
}
