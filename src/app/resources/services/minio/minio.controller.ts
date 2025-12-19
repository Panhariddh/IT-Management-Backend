import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
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
      // Properly construct object name with URL encoding
      const decodedFolder = decodeURIComponent(folder);
      const decodedFilename = decodeURIComponent(filename);
      const objectName = `${decodedFolder}/${decodedFilename}`;

      // Get the image stream from MinIO
      const { stream, contentType, contentLength } =
        await this.minioService.streamImage(objectName);

      // Set response headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${filename}"`,
      });

      // Pipe the stream to the response
      stream.pipe(res);

      // Handle stream errors
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          throw new NotFoundException('Image not found');
        }
      });
    } catch (error) {
      console.error('Controller error:', error);
      throw new NotFoundException('Image not found');
    }
  }
}
