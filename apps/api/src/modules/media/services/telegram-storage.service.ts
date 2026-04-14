import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
    const form = new FormData();
    form.append('chat_id', this.channelId);
    form.append('document', new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

    const res = await fetch(
      `https://api.telegram.org/bot${this.botToken}/sendDocument`,
      { method: 'POST', body: form },
    );

    const data = await res.json() as {
      ok: boolean;
      description?: string;
      result?: { document?: { file_id: string } };
    };

    if (!data.ok || !data.result?.document?.file_id) {
      this.logger.error(`Telegram upload failed: ${data.description ?? 'unknown error'}`);
      throw new Error(`Telegram upload failed: ${data.description ?? 'unknown error'}`);
    }

    return data.result.document.file_id;
  }

  /** Get a temporary download URL for a file_id (valid ~1 hour) */
  async getFileUrl(fileId: string): Promise<string> {
    const res = await fetch(
      `https://api.telegram.org/bot${this.botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
    );

    const data = await res.json() as {
      ok: boolean;
      description?: string;
      result?: { file_path?: string };
    };

    if (!data.ok || !data.result?.file_path) {
      throw new Error(`Telegram getFile failed: ${data.description ?? 'unknown error'}`);
    }

    return `https://api.telegram.org/file/bot${this.botToken}/${data.result.file_path}`;
  }
}
