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
      this.s3Client = new S3Client({
        endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: accessKeyId!,
          secretAccessKey: secretAccessKey!,
        },
        forcePathStyle: true,
      });
    } else {
      this.logger.warn('R2 Storage not configured (STORAGE_ENDPOINT missing) — media upload disabled');
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

  getPublicUrl(objectKey: string): string {
    const publicUrl = this.configService.get<string>('storage.publicUrl');
    return `${publicUrl}/${objectKey}`;
  }
}
