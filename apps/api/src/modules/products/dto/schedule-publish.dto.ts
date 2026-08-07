import { IsISO8601, IsOptional } from 'class-validator';

export class SchedulePublishDto {
  /** ISO datetime в будущем. null/отсутствие — отменить расписание. */
  @IsOptional()
  @IsISO8601()
  publishAt?: string | null;
}
