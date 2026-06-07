import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { join, extname } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * Stores uploaded media. Uses S3/R2-compatible object storage when configured
 * (durable, survives redeploys); otherwise falls back to local disk for dev.
 *
 * Env (all optional): S3_BUCKET, S3_REGION, S3_ENDPOINT (for R2/MinIO),
 * S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL (CDN/base URL).
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3?: S3Client;
  private bucket = process.env.S3_BUCKET;

  constructor() {
    if (this.bucket && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      this.s3 = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: !!process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
      });
      this.logger.log(`Media storage: S3 bucket "${this.bucket}"`);
    } else {
      this.logger.warn('Media storage: local disk (set S3_* env vars for durable production storage)');
    }
  }

  async store(file: { buffer: Buffer; originalname: string; mimetype: string }, reqOrigin: string): Promise<string> {
    const key = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;

    if (this.s3 && this.bucket) {
      await this.s3.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }),
      );
      const base = process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${this.bucket}`;
      return `${base.replace(/\/$/, '')}/${key}`;
    }

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, key), file.buffer);
    return `${reqOrigin}/uploads/${key}`;
  }
}
