import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Какой UI-control рисовать на фронте для редактирования поля.
 * Маппинг типа Prisma → input-type:
 *   String                       → 'string' (или 'text' если field name содержит "description"/"bio")
 *   Int / BigInt / Float / Decimal → 'number'
 *   Boolean                      → 'boolean'
 *   DateTime                     → 'datetime'
 *   Json                         → 'json'
 *   <enum>                       → 'enum' (+ enumValues)
 */
export type DbFieldType = 'string' | 'text' | 'number' | 'boolean' | 'datetime' | 'json' | 'enum';

export interface DbFieldMeta {
  name: string;
  type: DbFieldType;
  nullable: boolean;
  enumValues?: string[];
}

const LONG_TEXT_FIELDS = new Set(['description', 'bio', 'message', 'comment', 'notes']);

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

  /**
   * Достать metadata writable-полей через Prisma DMMF (data model meta format).
   * Это используется фронтом для рендера правильных input'ов: enum→<select>,
   * datetime→<input type="datetime-local">, json→<textarea>, и т.д.
   */
  private getFieldMetas(prismaModelName: string, writableFields: string[]): DbFieldMeta[] {
    // DMMF model name начинается с заглавной — у нас в config lowercase prismaModel.
    // Конвертируем 'user' → 'User'.
    const modelName = prismaModelName.charAt(0).toUpperCase() + prismaModelName.slice(1);
    const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
    if (!model) return [];

    return writableFields.map<DbFieldMeta>((fieldName) => {
      const field = model.fields.find((f) => f.name === fieldName);
      if (!field) return { name: fieldName, type: 'string', nullable: true };

      // enum
      if (field.kind === 'enum') {
        const enumDef = Prisma.dmmf.datamodel.enums.find((e) => e.name === field.type);
        return {
          name: fieldName,
          type: 'enum',
          nullable: !field.isRequired,
          enumValues: enumDef?.values.map((v) => v.name) ?? [],
        };
      }

      // scalar
      let type: DbFieldType = 'string';
      switch (field.type) {
        case 'Boolean':                                            type = 'boolean';  break;
        case 'Int': case 'BigInt': case 'Float': case 'Decimal':   type = 'number';   break;
        case 'DateTime':                                           type = 'datetime'; break;
        case 'Json':                                               type = 'json';     break;
        case 'String':
          type = LONG_TEXT_FIELDS.has(fieldName) ? 'text' : 'string';
          break;
      }

      return { name: fieldName, type, nullable: !field.isRequired };
    });
  }

  /**
   * Привести значение к нативному типу до записи в Prisma.
   * - boolean: 'true'/'false' → true/false
   * - number:  '42' → 42 (или Decimal-string как-есть для big precision)
   * - datetime: ISO-string или 'YYYY-MM-DDTHH:mm' → Date
   * - json: { ... } или JSON-string → объект
   * - nullable + пустая строка → null
   */
  private coerceField(meta: DbFieldMeta, raw: unknown): unknown {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string' && raw.trim() === '' && meta.nullable) return null;

    switch (meta.type) {
      case 'boolean':
        if (typeof raw === 'boolean') return raw;
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        throw new BadRequestException(`Field "${meta.name}" expects boolean, got: ${String(raw)}`);

      case 'number': {
        if (typeof raw === 'number') return raw;
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          throw new BadRequestException(`Field "${meta.name}" expects number, got: ${String(raw)}`);
        }
        return n;
      }

      case 'datetime': {
        if (raw instanceof Date) return raw;
        const d = new Date(raw as string);
        if (isNaN(d.getTime())) {
          throw new BadRequestException(`Field "${meta.name}" expects datetime, got: ${String(raw)}`);
        }
        return d;
      }

      case 'json': {
        if (typeof raw === 'object') return raw;
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); }
          catch { throw new BadRequestException(`Field "${meta.name}" expects valid JSON`); }
        }
        return raw;
      }

      case 'enum':
        if (typeof raw !== 'string' || !meta.enumValues?.includes(raw)) {
          throw new BadRequestException(
            `Field "${meta.name}" expects one of: ${meta.enumValues?.join(', ')} — got: ${String(raw)}`,
          );
        }
        return raw;

      case 'string':
      case 'text':
      default:
        return String(raw);
    }
  }

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
        const fieldMetas = this.getFieldMetas(cfg.prismaModel, cfg.writableFields);
        try {
          const count = await (this.prisma as any)[cfg.prismaModel].count();
          return { table: tableName, count, readonly: cfg.readonly ?? false, writableFields: cfg.writableFields, fieldMetas };
        } catch {
          return { table: tableName, count: 0, readonly: cfg.readonly ?? false, writableFields: cfg.writableFields, fieldMetas };
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
      fieldMetas: this.getFieldMetas(cfg.prismaModel, cfg.writableFields),
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

    const fieldMetas = this.getFieldMetas(cfg.prismaModel, cfg.writableFields);
    const metaByName = new Map(fieldMetas.map((m) => [m.name, m]));

    const safeData: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (!cfg.writableFields.includes(key)) continue;
      const meta = metaByName.get(key);
      if (!meta) continue;
      safeData[key] = this.coerceField(meta, data[key]);
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

    const fieldMetas = this.getFieldMetas(cfg.prismaModel, cfg.writableFields);
    const metaByName = new Map(fieldMetas.map((m) => [m.name, m]));

    const safeData: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (!cfg.writableFields.includes(key)) continue;
      const meta = metaByName.get(key);
      if (!meta) continue;
      const coerced = this.coerceField(meta, data[key]);
      // Не передавать null если поле NOT NULL — Prisma бросит более внятную ошибку.
      if (coerced === null && !meta.nullable) continue;
      safeData[key] = coerced;
    }

    const model = (this.prisma as any)[cfg.prismaModel];
    const created = await model.create({ data: safeData });
    return this.serialize(created);
  }
}
