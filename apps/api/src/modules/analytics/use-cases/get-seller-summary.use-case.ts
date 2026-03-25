import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AnalyticsRepository, SellerSummary } from '../repositories/analytics.repository';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class GetSellerSummaryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsRepo: AnalyticsRepository,
  ) {}

  async execute(user: JwtPayload): Promise<SellerSummary> {
    const store = await this.prisma.store.findUnique({
      where: { sellerId: user.sub },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException({ code: ErrorCode.STORE_NOT_FOUND });
    }

    return this.analyticsRepo.getSellerSummary(store.id);
  }
}
