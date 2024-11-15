import { TypedRoute } from '@nestia/core';
import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('api/files')
export class FilesController {
  @TypedRoute.Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('uploadFile', file);
    return 'fileId';
  }
}
