import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProductOptionGroup, ProductOptionValue } from '@prisma/client';

export type OptionGroupWithValues = ProductOptionGroup & {
  values: ProductOptionValue[];
};

@Injectable()
export class OptionGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProductId(productId: string): Promise<OptionGroupWithValues[]> {
    return this.prisma.productOptionGroup.findMany({
      where: { productId },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findGroupById(id: string): Promise<OptionGroupWithValues | null> {
    return this.prisma.productOptionGroup.findUnique({
      where: { id },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async createGroup(
    productId: string,
    data: { name: string; code: string; sortOrder?: number },
  ): Promise<OptionGroupWithValues> {
    return this.prisma.productOptionGroup.create({
      data: {
        productId,
        name: data.name,
        code: data.code,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async updateGroup(
    id: string,
    data: { name?: string; sortOrder?: number },
  ): Promise<OptionGroupWithValues> {
    return this.prisma.productOptionGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /**
   * Cascade deletes a group:
   * 1. Deactivates variants that use any value from this group
   * 2. Removes junction records (ProductVariantOptionValue)
   * 3. Removes values
   * 4. Removes the group
   * All in a single transaction.
   */
  async deleteGroup(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Find all option values in this group
      const optionValues = await tx.productOptionValue.findMany({
        where: { optionGroupId: id },
        select: { id: true },
      });
      const optionValueIds = optionValues.map((v) => v.id);

      if (optionValueIds.length > 0) {
        // Find variant ids that use any of these option values
        const junctions = await tx.productVariantOptionValue.findMany({
          where: { optionValueId: { in: optionValueIds } },
          select: { variantId: true },
        });
        const affectedVariantIds = [...new Set(junctions.map((j) => j.variantId))];

        // Deactivate affected variants (API-031)
        if (affectedVariantIds.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: affectedVariantIds } },
            data: { isActive: false },
          });
        }

        // Remove junction records
        await tx.productVariantOptionValue.deleteMany({
          where: { optionValueId: { in: optionValueIds } },
        });

        // Remove option values
        await tx.productOptionValue.deleteMany({
          where: { optionGroupId: id },
        });
      }

      // Remove the group itself
      await tx.productOptionGroup.delete({ where: { id } });
    });
  }

  async findValueById(id: string): Promise<ProductOptionValue | null> {
    return this.prisma.productOptionValue.findUnique({ where: { id } });
  }

  async createValue(
    optionGroupId: string,
    data: { value: string; code: string; sortOrder?: number },
  ): Promise<ProductOptionValue> {
    return this.prisma.productOptionValue.create({
      data: {
        optionGroupId,
        value: data.value,
        code: data.code,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateValue(
    id: string,
    data: { value?: string; sortOrder?: number },
  ): Promise<ProductOptionValue> {
    return this.prisma.productOptionValue.update({
      where: { id },
      data: {
        ...(data.value !== undefined && { value: data.value }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async deleteValue(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Remove junction records before deleting the value
      await tx.productVariantOptionValue.deleteMany({ where: { optionValueId: id } });
      await tx.productOptionValue.delete({ where: { id } });
    });
  }
}
