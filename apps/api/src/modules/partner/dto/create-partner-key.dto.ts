import { IsString, IsUUID, MaxLength } from 'class-validator';

// PARTNER-API-RAOS-001: admin выдаёт партнёрский ключ конкретному магазину.
export class CreatePartnerKeyDto {
  @IsUUID()
  storeId!: string;

  @IsString()
  @MaxLength(64)
  name!: string; // "RAOS"
}
