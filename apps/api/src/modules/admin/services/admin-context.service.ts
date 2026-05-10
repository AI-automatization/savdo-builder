import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { AdminRepository } from '../repositories/admin.repository';

/**
 * AdminContextService — общий helper `requireAdmin(jwt)` для всех admin
 * controllers (Wave 12 split). Раньше каждый controller дублировал свой
 * `requireAdmin`/`resolveAdminUser` private метод — теперь единая точка.
 */
@Injectable()
export class AdminContextService {
  constructor(private readonly adminRepo: AdminRepository) {}

  /**
   * Проверить что JWT-юзер существует как AdminUser (role=ADMIN в JWT не
   * гарантирует наличия admin-профиля). Кидает FORBIDDEN если нет.
   */
  async requireAdmin(user: JwtPayload) {
    const adminUser = await this.adminRepo.findAdminByUserId(user.sub);
    if (!adminUser) {
      throw new DomainException(
        ErrorCode.ADMIN_NOT_FOUND,
        'Admin record not found for this user',
        HttpStatus.FORBIDDEN,
      );
    }
    return adminUser;
  }
}
