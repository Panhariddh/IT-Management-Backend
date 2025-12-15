import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../../services/minio.service';


@Controller()
export class UploadController {
  constructor(private readonly minioService: MinioService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const objectName = await this.minioService.uploadImage(file);
    const url = this.minioService.getPublicUrl(objectName);

    return {
      success: true,
      objectName,
      url,
    };
  }
}
