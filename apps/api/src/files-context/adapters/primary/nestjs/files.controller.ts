import { TypedRoute } from '@nestia/core';
import {
  Controller,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createZodDto } from 'nestjs-zod';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';
import { GenerateFilesUrlsUseCase } from 'src/files-context/business-logic/use-cases/files-url-generation/generate-files-urls';
import { z } from 'zod';

export class FileNamesQueryDto extends createZodDto(
  z.object({
    names: z
      .union([z.string(), z.array(z.string())])
      .transform((value) => (Array.isArray(value) ? value : [value])),
  }),
) {}

@Controller('api/files')
export class FilesController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly generateFilesUrlsUseCase: GenerateFilesUrlsUseCase,
  ) {}

  @TypedRoute.Post('upload-one')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadFileUseCase.execute(
      file.buffer,
      file.originalname,
      file.mimetype,
      null,
    );
  }

  @Get()
  async getSignedUrls(@Query() query: FileNamesQueryDto) {
    return this.generateFilesUrlsUseCase.execute(query.names);
  }
}
