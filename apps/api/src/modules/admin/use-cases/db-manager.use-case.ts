import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

// Whitelist: which Prisma models are accessible and which fields can be written
const TABLE_CONFIG: Record<string, {
  prismaModel: string;
  searchFields: string[];
  writableFields: string[];
  readonly?: boolean;
}> = {
  users:           { prismaModel: 'user',           searchFields: ['phone', 'id'],              writableFields: ['status', 'languageCode'] },
  sellers:         { prismaModel: 'seller',          searchFields: ['fullName', 'id'],           writableFields: ['verificationStatus', 'bio', 'isBlocked'] },
  stores:          { prismaModel: 'store',           searchFields: ['name', 'slug', 'id'],       writableFields: ['status', 'description'] },
  products:        { prismaModel: 'product',         searchFields: ['name', 'id'],               writableFields: ['status', 'name'] },
  orders:          { prismaModel: 'order',           searchFields: ['id'],                       writableFields: ['status'] },
  audit_logs:      { prismaModel: 'auditLog',        searchFields: ['action', 'entityId', 'id'], writableFields: [], readonly: true },
  broadcast_logs:  { prismaModel: 'broadcastLog',    searchFields: ['message', 'id'],            writableFields: [], readonly: true },
  moderation_cases:{ prismaModel: 'moderationCase',  searchFields: ['caseType', 'id'],           writableFields: ['status'] },
  categories:      { prismaModel: 'globalCategory',  searchFields: ['name', 'id'],               writableFields: ['name', 'slug', 'isActive'] },
  buyers:          { prismaModel: 'buyer',           searchFields: ['id'],                       writableFields: [] , readonly: true },
};

export const ALLOWED_TABLES = Object.keys(TABLE_CONFIG);

@Injectable()
export class DbManagerUseCase {
  constructor(private readonly prisma: PrismaService) {}

  // List all tables with row count
  async listTables() {
    const counts = await Promise.all(
      ALLOWED_TABLES.map(async (tableName) => {
        const cfg = TABLE_CONFIG[tableName];
        try {
          const count = await (this.prisma as any)[cfg.prismaModel].count();
          return { table: tableName, count, readonly: cfg.readonly ?? false, writableFields: cfg.writableFields };
        } catch {
          return { table: tableName, count: 0, readonly: cfg.readonly ?? false, writableFields: cfg.writableFields };
        }
      }),
    );
    return counts;
  }

  // Get rows from a table
  async getRows(tableName: string, opts: { page: number; limit: number; search?: string }) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not in the allowed list`);

    const { page = 1, limit = 20, search } = opts;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const where: any = {};
    if (search && cfg.searchFields.length > 0) {
      where.OR = cfg.searchFields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    const model = (this.prisma as any)[cfg.prismaModel];
    const [rows, total] = await this.prisma.$transaction([
      model.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      model.count({ where }),
    ]);

    return {
      table: tableName,
      rows,
      total,
      page,
      totalPages: Math.ceil(total / take),
      writableFields: cfg.writableFields,
      readonly: cfg.readonly ?? false,
    };
  }

  // Update a row (only whitelisted fields)
  async updateRow(tableName: string, id: string, data: Record<string, unknown>) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not allowed`);
    if (cfg.readonly) throw new BadRequestException(`Table "${tableName}" is read-only`);

    // Strip fields that are not in the whitelist
    const safeData: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (cfg.writableFields.includes(key)) {
        safeData[key] = data[key];
      }
    }
    if (Object.keys(safeData).length === 0) {
      throw new BadRequestException('No writable fields provided');
    }

    const model = (this.prisma as any)[cfg.prismaModel];
    const existing = await model.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Row with id="${id}" not found`);

    return model.update({ where: { id }, data: safeData });
  }

  // Delete a row
  async deleteRow(tableName: string, id: string) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not allowed`);
    if (cfg.readonly) throw new BadRequestException(`Table "${tableName}" is read-only`);

    const model = (this.prisma as any)[cfg.prismaModel];
    const existing = await model.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Row with id="${id}" not found`);

    await model.delete({ where: { id } });
    return { deleted: true, id };
  }

  // Insert a new row (only whitelisted fields + required fields caller provides)
  async insertRow(tableName: string, data: Record<string, unknown>) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not allowed`);
    if (cfg.readonly) throw new BadRequestException(`Table "${tableName}" is read-only`);

    const safeData: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (cfg.writableFields.includes(key)) {
        safeData[key] = data[key];
      }
    }

    const model = (this.prisma as any)[cfg.prismaModel];
    return model.create({ data: safeData });
  }
}
