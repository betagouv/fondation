import { TypedRoute } from '@nestia/core';
import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';

@Controller('api/files')
export class FilesController {
  constructor(private readonly uploadFileUseCase: UploadFileUseCase) {}

  @TypedRoute.Post('upload-one')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadFileUseCase.execute(file.buffer, file.originalname);
  }
}
