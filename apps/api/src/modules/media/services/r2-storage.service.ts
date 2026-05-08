import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGNED_URL_TTL_SECONDS = 300;

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('storage.endpoint');
    const accessKeyId = this.configService.get<string>('storage.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey');

    this.configured = Boolean(endpoint && accessKeyId && secretAccessKey);

    if (this.configured) {
      try {
        new URL(endpoint!); // validate URL format before trusting the value
      } catch {
        this.logger.error(
          `STORAGE_ENDPOINT "${endpoint}" is not a valid URL — media upload disabled`,
        );
        this.configured = false;
      }
    }

    if (this.configured) {
      // STORAGE_REGION:
      //   - Cloudflare R2 принимает 'auto'
      //   - Supabase требует project_region (us-east-1, eu-west-1 etc)
      //   - AWS S3 — bucket region
      // SigV4 подпись зависит от region. Несовпадение → 403 SignatureDoesNotMatch.
      const region = this.configService.get<string>('storage.region') ?? 'us-east-1';
      this.s3Client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: accessKeyId!,
          secretAccessKey: secretAccessKey!,
        },
        forcePathStyle: true,
      });
      this.logger.log(`S3 storage configured: endpoint=${endpoint} region=${region}`);
    } else {
      this.logger.warn('S3 Storage not configured (STORAGE_ENDPOINT missing or invalid) — media upload disabled');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async generateUploadUrl(
    bucket: string,
    objectKey: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; expiresIn: number }> {
    if (!this.s3Client) throw new Error('R2 Storage is not configured');

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });

    return { uploadUrl, expiresIn: PRESIGNED_URL_TTL_SECONDS };
  }

  async deleteObject(bucket: string, objectKey: string): Promise<void> {
    if (!this.s3Client) throw new Error('R2 Storage is not configured');

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
    } catch (err) {
      this.logger.error(`Failed to delete object ${bucket}/${objectKey}`, err);
      throw err;
    }
  }

  /** Direct server-side upload (multipart from request → S3-compatible storage). */
  async uploadObject(
    bucket: string,
    objectKey: string,
    body: Buffer,
    mimeType: string,
  ): Promise<void> {
    if (!this.s3Client) throw new Error('S3 Storage is not configured');

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: body,
          ContentType: mimeType,
        }),
      );
    } catch (err) {
      // Без этих логов в prod невозможно диагностировать почему upload падает в TG fallback.
      // Типовые причины:
      //   InvalidAccessKeyId   — STORAGE_ACCESS_KEY_ID опечатка/неактивный
      //   SignatureDoesNotMatch — STORAGE_REGION или SECRET_ACCESS_KEY неверны
      //   NoSuchBucket          — STORAGE_BUCKET_PUBLIC не создан в Supabase
      //   AccessDenied          — RLS policy на storage.objects (для anon/authenticated; service-role bypass'ит)
      //   ENOTFOUND/CONNREFUSED — STORAGE_ENDPOINT неверный URL
      const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number }; message?: string };
      this.logger.error(
        `S3 uploadObject failed: bucket=${bucket} key=${objectKey} ` +
        `errorCode=${e?.Code ?? e?.name ?? 'unknown'} ` +
        `httpStatus=${e?.$metadata?.httpStatusCode ?? 'unknown'} ` +
        `message=${e?.message ?? String(err)}`,
      );
      throw err;
    }
  }

  getDefaultBucket(): string {
    return this.configService.get<string>('storage.bucketPublic') ?? 'savdo-public';
  }

  getPublicUrl(objectKey: string): string {
    const publicUrl = this.configService.get<string>('storage.publicUrl');
    if (!publicUrl) {
      this.logger.warn(
        `STORAGE_PUBLIC_URL is missing — image URLs will be broken. ` +
        `Set it to your R2 public bucket URL (e.g. https://pub-xxxx.r2.dev or your CDN domain).`,
      );
      return '';
    }
    return `${publicUrl.replace(/\/$/, '')}/${objectKey}`;
  }
}
