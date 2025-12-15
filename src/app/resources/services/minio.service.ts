import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

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
      console.log(`✅ MinIO bucket created: ${this.bucket}`);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'images',
  ): Promise<string> {
    const objectName = `${folder}/${Date.now()}-${file.originalname}`;

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

  getPublicUrl(objectName: string) {
    return `http://localhost:9000/${this.bucket}/${objectName}`;
  }
}
