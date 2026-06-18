import { Injectable } from '@nestjs/common';
import {
  SubscriptionPayment,
  SubscriptionPaymentMethod,
  SubscriptionPaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SubscriptionPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SubscriptionPayment | null> {
    return this.prisma.subscriptionPayment.findUnique({ where: { id } });
  }

  async listBySubscription(subscriptionId: string): Promise<SubscriptionPayment[]> {
    return this.prisma.subscriptionPayment.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    subscriptionId: string;
    amountUzs: number;
    method: SubscriptionPaymentMethod;
    status?: SubscriptionPaymentStatus;
    periodStart: Date;
    periodEnd: Date;
    confirmedByUserId?: string;
    confirmedAt?: Date;
    notes?: string;
    externalId?: string;
  }): Promise<SubscriptionPayment> {
    return this.prisma.subscriptionPayment.create({ data });
  }
}
