import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramStorageService {
  private readonly logger = new Logger(TelegramStorageService.name);
  private readonly botToken: string;
  private readonly channelId: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    this.channelId = this.config.get<string>('TELEGRAM_STORAGE_CHANNEL_ID') ?? '';
  }

  isConfigured(): boolean {
    return Boolean(this.botToken && this.channelId);
  }

  /** Upload a file buffer to Telegram and return its file_id */
  async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    // Build multipart/form-data manually — avoids Node.js native Blob/FormData bugs
    const boundary = '----TgBoundary' + Date.now().toString(16);

    const parts: Buffer[] = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${this.channelId}\r\n`),
      // Prevent Telegram from converting images to compressed photos
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="disable_content_type_detection"\r\n\r\ntrue\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];

    const body = Buffer.concat(parts);

    const res = await axios.post<{
      ok: boolean;
      description?: string;
      result?: { document?: { file_id: string } };
    }>(
      `https://api.telegram.org/bot${this.botToken}/sendDocument`,
      body,
      {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    const data = res.data;

    if (!data.ok || !data.result?.document?.file_id) {
      const desc = data.description ?? JSON.stringify(data);
      this.logger.error(`Telegram upload failed: ${desc}`);
      throw new Error(`Telegram upload failed: ${desc}`);
    }

    return data.result.document.file_id;
  }

  /** Get a temporary download URL for a file_id (valid ~1 hour) */
  async getFileUrl(fileId: string): Promise<string> {
    const res = await axios.get<{
      ok: boolean;
      description?: string;
      result?: { file_path?: string };
    }>(`https://api.telegram.org/bot${this.botToken}/getFile`, {
      params: { file_id: fileId },
    });

    const data = res.data;

    if (!data.ok || !data.result?.file_path) {
      throw new Error(`Telegram getFile failed: ${data.description ?? 'unknown error'}`);
    }

    return `https://api.telegram.org/file/bot${this.botToken}/${data.result.file_path}`;
  }
}
