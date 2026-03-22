import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class LogoutSessionUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(sessionId: string): Promise<void> {
    await this.authRepo.deleteSession(sessionId).catch(() => {
      // Session may already be deleted — not an error
    });
  }
}
