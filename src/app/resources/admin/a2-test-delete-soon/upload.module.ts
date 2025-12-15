import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MinioService } from '../../services/minio.service';

@Module({
  imports: [],
  controllers: [UploadController],
  providers: [MinioService],
})
export class UploadModule {}