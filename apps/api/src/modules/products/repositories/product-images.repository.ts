import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProductImage } from '@prisma/client';

@Injectable()
export class ProductImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countByProductId(productId: string): Promise<number> {
    return this.prisma.productImage.count({ where: { productId } });
  }

  async findByProductAndId(productId: string, imageId: string): Promise<{ id: string } | null> {
    return this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
      select: { id: true },
    });
  }

  async create(data: {
    productId: string;
    mediaId: string;
    sortOrder: number;
    isPrimary: boolean;
  }) {
    return this.prisma.productImage.create({
      data,
      include: { media: true },
    });
  }

  async clearPrimary(productId: string, excludeId?: string): Promise<void> {
    await this.prisma.productImage.updateMany({
      where: {
        productId,
        isPrimary: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { isPrimary: false },
    });
  }

  async update(imageId: string, data: { sortOrder?: number; isPrimary?: boolean }) {
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: {
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
      },
      include: { media: true },
    });
  }

  async delete(productId: string, imageId: string): Promise<void> {
    await this.prisma.productImage.deleteMany({ where: { id: imageId, productId } });
  }
}
