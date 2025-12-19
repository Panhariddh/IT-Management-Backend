import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Client;
  private readonly bucket: string;

  constructor() {
    if (!process.env.MINIO_BUCKET) {
      throw new Error('MINIO_BUCKET is not defined');
    }

    this.bucket = process.env.MINIO_BUCKET;

    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? '',
      secretKey: process.env.MINIO_SECRET_KEY ?? '',
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'images',
  ): Promise<string> {
    // Generate random filename
    const randomFileName = this.generateRandomFileName(file);
    const objectName = `${folder}/${randomFileName}`;

    await this.client.putObject(
      this.bucket,
      objectName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      },
    );

    return objectName;
  }

  private generateRandomFileName(file: Express.Multer.File): string {
    // Generate random string (16 characters)
    const randomFileName =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10);

    // Get file extension from original name or mimetype
    let extension = '';
    const originalName = file.originalname;

    if (originalName && originalName.includes('.')) {
      extension = originalName.split('.').pop()?.toLowerCase() || '';
    } else {
      // Extract extension from mimetype
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'image/bmp': 'bmp',
        'image/x-icon': 'ico',
      };
      extension = mimeToExt[file.mimetype] || 'jpg';
    }

    return `${randomFileName}.${extension}`;
  }

  getProxiedUrl(objectName: string) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${backendUrl}/api/images/${objectName}`;
  }

  async streamImage(objectName: string): Promise<{
    stream: Readable;
    contentType: string;
    contentLength: number;
  }> {
    try {
      const stat = await this.client.statObject(this.bucket, objectName);
      const stream = await this.client.getObject(this.bucket, objectName);
      const contentType =
        stat.metaData['content-type'] || this.getContentType(objectName);

      return {
        stream,
        contentType,
        contentLength: stat.size,
      };
    } catch (error) {
      console.error('Error streaming image from MinIO:', error);
      throw new NotFoundException('Image not found in storage');
    }
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  async deleteImage(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch (error) {
      console.error('Error deleting image from MinIO:', error);
      throw new NotFoundException('Image not found or could not be deleted');
    }
  }
}
