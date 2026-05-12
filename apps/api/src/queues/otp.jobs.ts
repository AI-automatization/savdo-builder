export const OTP_JOB_SEND_TELEGRAM = 'send-telegram';

/** Redis key для OTP code lookup из processor. TTL 10 минут — больше чем job
 *  retry window, но меньше чем OTP request expiry (5 мин) + запас. */
export const OTP_CODE_REF_KEY = (codeRef: string) => `otp:job:${codeRef}`;
export const OTP_CODE_REF_TTL_SECONDS = 10 * 60;

/**
 * API-BULL-BOARD-DATA-LEAK-001 (SEC-008): код НЕ хранится в job.data.
 * Bull Board UI показывал `data.code` в preview → утечка через ?token URL.
 * Теперь job data содержит только `codeRef` (UUID), реальный code лежит
 * в Redis по `otp:job:{codeRef}` и удаляется processor'ом после отправки.
 */
export interface OtpSendTelegramJobData {
  chatId: string;
  phone: string;
  codeRef: string;
}
