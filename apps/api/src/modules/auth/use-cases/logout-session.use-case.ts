import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class LogoutSessionUseCase {
  private readonly logger = new Logger(LogoutSessionUseCase.name);

  constructor(private readonly authRepo: AuthRepository) {}

  async execute(sessionId: string): Promise<void> {
    this.logger.log(`Logout: sessionId=${sessionId}`);
    try {
      await this.authRepo.deleteSession(sessionId);
      this.logger.log(`Session deleted: ${sessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`deleteSession failed (${sessionId}): ${msg}`);
    }
  }
}
