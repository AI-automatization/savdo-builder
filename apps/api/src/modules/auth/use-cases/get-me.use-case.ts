import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class GetMeUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return { success: true, data: user };
  }
}
