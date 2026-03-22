import { IsString, IsNotEmpty, IsIn, IsInt, Min, Max } from 'class-validator';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const ALLOWED_PURPOSES = [
  'product_image',
  'seller_doc',
  'store_logo',
  'store_banner',
] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class RequestUploadDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_MIME_TYPES, {
    message: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_PURPOSES, {
    message: `purpose must be one of: ${ALLOWED_PURPOSES.join(', ')}`,
  })
  purpose: string;

  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES, {
    message: 'File size must not exceed 10 MB',
  })
  sizeBytes: number;
}
