import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreatePartnerKeyDto } from './dto/create-partner-key.dto';
import { ManagePartnerKeysUseCase } from './use-cases/manage-partner-keys.use-case';

/**
 * PARTNER-API-RAOS-001: управление партнёрскими ключами из admin-панели.
 * Permission `system:integrations` — есть у super_admin (`*`) и admin
 * (`system:*`); кастомным ролям ресурс `system` reserved и не выдаётся.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/partner-keys')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
@AdminPermission('system:integrations')
export class PartnerKeysAdminController {
  constructor(private readonly manageKeys: ManagePartnerKeysUseCase) {}

  // POST /api/v1/admin/partner-keys — plaintext ключа в ответе ОДИН раз.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async issue(@CurrentUser() user: JwtPayload, @Body() dto: CreatePartnerKeyDto) {
    return this.manageKeys.issue(user.sub, dto.storeId, dto.name);
  }

  // GET /api/v1/admin/partner-keys
  @Get()
  async list() {
    return this.manageKeys.list();
  }

  // DELETE /api/v1/admin/partner-keys/:id — revoke (isActive=false), строка остаётся.
  @Delete(':id')
  async revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.manageKeys.revoke(user.sub, id);
  }
}
