import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class GetMeUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    // HYBRID-6: способности для тоггла контекста (продавец/покупатель) в TMA.
    const capabilities = await this.authRepository.findCapabilities(userId);

    // API-RESPONSE-TYPES-RECONCILE-001: отдаём собранное `name` (firstName +
    // lastName), которое web-buyer checkout уже ожидает на AuthUser. Сами
    // firstName/lastName наружу не выносим — buyer-объект остаётся { id, avatarUrl }.
    const { buyer, ...rest } = user;
    const name = buyer
      ? [buyer.firstName, buyer.lastName].filter(Boolean).join(' ').trim() || undefined
      : undefined;

    return {
      success: true,
      data: {
        ...rest,
        ...(name ? { name } : {}),
        buyer: buyer ? { id: buyer.id, avatarUrl: buyer.avatarUrl } : null,
        capabilities,
      },
    };
  }
}
