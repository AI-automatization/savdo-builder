import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { MediaModule } from '../media/media.module';
import { StoresModule } from '../stores/stores.module';
import { AuditModule } from '../audit/audit.module';
import { PartnerController } from './partner.controller';
import { PartnerKeysAdminController } from './partner-keys.admin.controller';
import { PartnerApiKeysRepository } from './repositories/partner-api-keys.repository';
import { PartnerApiKeyGuard } from './guards/partner-api-key.guard';
import { PartnerCreateProductUseCase } from './use-cases/partner-create-product.use-case';
import { ManagePartnerKeysUseCase } from './use-cases/manage-partner-keys.use-case';

// PARTNER-API-RAOS-001: партнёрский API (RAOS → MaxSavdo).
// Отдельный модуль, а не расширение ProductsModule: другая auth-модель
// (API-key вместо JWT) не должна смешиваться с seller-контроллерами.
@Module({
  imports: [ProductsModule, MediaModule, StoresModule, AuditModule],
  controllers: [PartnerController, PartnerKeysAdminController],
  providers: [
    PartnerApiKeysRepository,
    PartnerApiKeyGuard,
    PartnerCreateProductUseCase,
    ManagePartnerKeysUseCase,
  ],
})
export class PartnerModule {}
