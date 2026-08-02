import { IsInt, Min } from 'class-validator';

// INTEG-RAOS-002 (issue #5): абсолютный остаток (не дельта) — RAOS шлёт
// пересчитанное значение (уже с учётом своего буфера К·3), мы просто пишем его.
export class PartnerUpdateStockDto {
  @IsInt()
  @Min(0)
  stock!: number;
}
