import { Injectable } from '@nestjs/common';
import { MediaVisibility } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    ownerUserId: string;
    bucket: string;
    objectKey: string;
    mimeType: string;
    fileSize: bigint;
    visibility: MediaVisibility;
  }) {
    return this.prisma.mediaFile.create({ data });
  }

  async findById(id: string) {
    return this.prisma.mediaFile.findUnique({ where: { id } });
  }

  async confirm(id: string) {
    return this.prisma.mediaFile.update({
      where: { id },
      data: { visibility: MediaVisibility.PUBLIC },
    });
  }

  async findByOwner(ownerUserId: string, visibility?: MediaVisibility) {
    return this.prisma.mediaFile.findMany({
      where: {
        ownerUserId,
        ...(visibility ? { visibility } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    await this.prisma.mediaFile.delete({ where: { id } });
  }
}
