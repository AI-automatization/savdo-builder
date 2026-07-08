import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListOrdersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  // FEAT-ORDERS-ARCHIVE-001: query-параметр (строка) — 'true' показывает архив покупателя.
  // Парсится в boolean в контроллере (query всегда строка).
  @IsOptional()
  @IsString()
  archived?: string;
}
