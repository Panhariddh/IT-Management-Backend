import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { ImagesController } from './images.controller';


@Module({
  providers: [MinioService],
  exports: [MinioService],
  controllers: [ImagesController],
})
export class MinioModule {}