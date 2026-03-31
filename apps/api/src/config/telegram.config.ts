import { registerAs } from '@nestjs/config';

export const telegramConfig = registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  botUsername: process.env.TELEGRAM_BOT_USERNAME ?? 'savdo_builderBOT',
}));
