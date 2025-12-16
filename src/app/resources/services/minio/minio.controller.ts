import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { MinioService } from './minio.service';

@Controller()
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Get(':folder/:filename')
  async getImage(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const objectName = `${folder}/${filename}`;
      
      // Get the image stream from MinIO
      const { stream, contentType, contentLength } = 
        await this.minioService.streamImage(objectName);
      
      // Set response headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
      
      // Pipe the stream to the response
      stream.pipe(res);
      
      // Handle stream errors
      stream.on('error', () => {
        throw new NotFoundException('Image not found');
      });
    } catch (error) {
      throw new NotFoundException('Image not found');
    }
  }
}