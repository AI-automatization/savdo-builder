import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProductAttribute } from '@prisma/client';

@Injectable()
export class ProductAttributesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProductId(productId: string): Promise<ProductAttribute[]> {
    return this.prisma.productAttribute.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByProductAndId(productId: string, attrId: string): Promise<{ id: string } | null> {
    return this.prisma.productAttribute.findFirst({
      where: { id: attrId, productId },
      select: { id: true },
    });
  }

  async create(data: {
    productId: string;
    name: string;
    value: string;
    sortOrder: number;
  }): Promise<ProductAttribute> {
    return this.prisma.productAttribute.create({ data });
  }

  async update(
    attrId: string,
    data: { name?: string; value?: string; sortOrder?: number },
  ): Promise<ProductAttribute> {
    return this.prisma.productAttribute.update({
      where: { id: attrId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async delete(productId: string, attrId: string): Promise<void> {
    await this.prisma.productAttribute.deleteMany({ where: { id: attrId, productId } });
  }
}
