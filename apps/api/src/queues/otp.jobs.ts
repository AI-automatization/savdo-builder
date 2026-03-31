export const OTP_JOB_SEND_TELEGRAM = 'send-telegram';

export interface OtpSendTelegramJobData {
  chatId: string;
  phone: string;
  code: string;
}
