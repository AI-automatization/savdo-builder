import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface AdminCreateStoreInput {
  sellerId: string;
  name: string;
  city: string;
  telegramContactLink: string;
  description?: string;
  region?: string;
  slug?: string;
}

@Injectable()
export class AdminCreateStoreUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'store';
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = this.slugify(base);
    let attempt = 0;
    while (await this.prisma.store.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${this.slugify(base)}-${attempt}`;
    }
    return slug;
  }

  async execute(input: AdminCreateStoreInput) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: input.sellerId },
      include: { store: true },
    });

    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    // INV-S01: one store per seller
    if (seller.store) {
      throw new DomainException(
        ErrorCode.CONFLICT,
        'Seller already has a store',
        HttpStatus.CONFLICT,
      );
    }

    const slug = input.slug
      ? input.slug
      : await this.uniqueSlug(input.name);

    // Check slug uniqueness if provided manually
    if (input.slug) {
      const taken = await this.prisma.store.findUnique({ where: { slug: input.slug } });
      if (taken) {
        throw new DomainException(ErrorCode.CONFLICT, 'Slug is already taken', HttpStatus.CONFLICT);
      }
    }

    return this.prisma.store.create({
      data: {
        sellerId: input.sellerId,
        name: input.name,
        slug,
        description: input.description,
        city: input.city,
        region: input.region,
        telegramContactLink: input.telegramContactLink,
        status: 'ACTIVE' as any, // admin bypass — skip DRAFT→review flow
        isPublic: true,
        publishedAt: new Date(),
        deliverySettings: {
          create: {
            supportsDelivery: true,
            supportsPickup: false,
            deliveryFeeType: 'fixed',
          },
        },
      },
      include: { seller: true, deliverySettings: true },
    });
  }
}
