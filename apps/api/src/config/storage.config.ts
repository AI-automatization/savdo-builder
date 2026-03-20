import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT,
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  bucketPublic: process.env.STORAGE_BUCKET_PUBLIC ?? 'savdo-public',
  bucketPrivate: process.env.STORAGE_BUCKET_PRIVATE ?? 'savdo-private',
  publicUrl: process.env.STORAGE_PUBLIC_URL,
}));
