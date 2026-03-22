import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Buyer } from '@prisma/client';

@Injectable()
export class BuyerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Buyer | null> {
    return this.prisma.buyer.findUnique({ where: { userId } });
  }
}
