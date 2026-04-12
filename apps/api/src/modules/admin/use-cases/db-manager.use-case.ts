import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const TABLE_CONFIG: Record<string, {
  prismaModel: string;
  searchFields: string[];
  writableFields: string[];
  readonly?: boolean;
}> = {
  users:            { prismaModel: 'user',           searchFields: ['phone'],                               writableFields: ['role', 'status', 'languageCode'] },
  sellers:          { prismaModel: 'seller',          searchFields: ['fullName', 'telegramUsername'],        writableFields: ['verificationStatus', 'bio', 'isBlocked'] },
  stores:           { prismaModel: 'store',           searchFields: ['name', 'slug'],                       writableFields: ['status', 'description'] },
  products:         { prismaModel: 'product',         searchFields: ['title'],                              writableFields: ['status', 'title'] },
  orders:           { prismaModel: 'order',           searchFields: ['orderNumber', 'customerPhone', 'customerFullName'], writableFields: ['status'] },
  audit_logs:       { prismaModel: 'auditLog',        searchFields: ['action', 'entityType'],               writableFields: [], readonly: true },
  broadcast_logs:   { prismaModel: 'broadcastLog',    searchFields: ['message'],                            writableFields: [], readonly: true },
  moderation_cases: { prismaModel: 'moderationCase',  searchFields: ['caseType'],                           writableFields: ['status'] },
  categories:       { prismaModel: 'globalCategory',  searchFields: ['nameRu', 'slug'],                     writableFields: ['nameRu', 'nameUz', 'slug', 'isActive'] },
  buyers:           { prismaModel: 'buyer',           searchFields: ['firstName', 'lastName', 'telegramUsername'], writableFields: [], readonly: true },
};

export const ALLOWED_TABLES = Object.keys(TABLE_CONFIG);

@Injectable()
export class DbManagerUseCase {
  constructor(private readonly prisma: PrismaService) {}

  // Recursively convert BigInt → string, Date → ISO string (JSON-safe)
  private serialize(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') return data.toString();
    if (data instanceof Date) return data.toISOString();
    if (Array.isArray(data)) return data.map(item => this.serialize(item));
    if (typeof data === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        result[k] = this.serialize(v);
      }
      return result;
    }
    return data;
  }

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

  async getRows(tableName: string, opts: { page: number; limit: number; search?: string }) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not in the allowed list`);

    const { page = 1, limit = 25, search } = opts;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const where: any = {};
    if (search && cfg.searchFields.length > 0) {
      where.OR = cfg.searchFields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    const model = (this.prisma as any)[cfg.prismaModel];

    let rows: any[] = [];
    let total = 0;
    try {
      [rows, total] = await this.prisma.$transaction([
        model.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
        model.count({ where }),
      ]);
    } catch {
      // fallback: try without orderBy (for tables with unusual schema)
      [rows, total] = await this.prisma.$transaction([
        model.findMany({ where, skip, take }),
        model.count({ where }),
      ]);
    }

    return {
      table: tableName,
      rows: this.serialize(rows) as Record<string, unknown>[],
      total,
      page,
      totalPages: Math.ceil(total / take) || 1,
      writableFields: cfg.writableFields,
      readonly: cfg.readonly ?? false,
    };
  }

  async getRow(tableName: string, id: string) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not in the allowed list`);

    const model = (this.prisma as any)[cfg.prismaModel];
    const row = await model.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Row with id="${id}" not found in "${tableName}"`);

    return {
      table: tableName,
      row: this.serialize(row) as Record<string, unknown>,
      writableFields: cfg.writableFields,
      readonly: cfg.readonly ?? false,
    };
  }

  async updateRow(tableName: string, id: string, data: Record<string, unknown>) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not allowed`);
    if (cfg.readonly) throw new BadRequestException(`Table "${tableName}" is read-only`);

    const safeData: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (cfg.writableFields.includes(key)) {
        // coerce 'true'/'false' strings to boolean where applicable
        const val = data[key];
        safeData[key] = val === 'true' ? true : val === 'false' ? false : val;
      }
    }
    if (Object.keys(safeData).length === 0) {
      throw new BadRequestException('No writable fields provided');
    }

    const model = (this.prisma as any)[cfg.prismaModel];
    const existing = await model.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Row with id="${id}" not found`);

    const updated = await model.update({ where: { id }, data: safeData });
    return this.serialize(updated);
  }

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

  async insertRow(tableName: string, data: Record<string, unknown>) {
    const cfg = TABLE_CONFIG[tableName];
    if (!cfg) throw new BadRequestException(`Table "${tableName}" is not allowed`);
    if (cfg.readonly) throw new BadRequestException(`Table "${tableName}" is read-only`);

    const safeData: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (cfg.writableFields.includes(key)) {
        const val = data[key];
        safeData[key] = val === 'true' ? true : val === 'false' ? false : val;
      }
    }

    const model = (this.prisma as any)[cfg.prismaModel];
    const created = await model.create({ data: safeData });
    return this.serialize(created);
  }
}
