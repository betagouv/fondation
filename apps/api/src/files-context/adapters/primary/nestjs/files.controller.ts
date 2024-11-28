import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeleteFileUseCase } from 'src/files-context/business-logic/use-cases/file-deletion/delete-file';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';
import { GenerateFilesUrlsUseCase } from 'src/files-context/business-logic/use-cases/files-url-generation/generate-files-urls';
import { FileDeletionParamDto } from '../dto/file-deletion.dto';
import { FileUploadQueryDto } from '../dto/file-upload-query.dto';
import { FilesUrlsQueryDto } from '../dto/files-urls-query.dto';

@Controller('api/files')
export class FilesController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly generateFilesUrlsUseCase: GenerateFilesUrlsUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
  ) {}

  @Post('upload-one')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Query() query: FileUploadQueryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { bucket, path, fileId } = query;
    return this.uploadFileUseCase.execute(
      fileId,
      file.buffer,
      file.originalname,
      file.mimetype,
      bucket,
      path,
    );
  }

  @Get('signed-urls')
  async getSignedUrls(@Query() { ids }: FilesUrlsQueryDto) {
    return this.generateFilesUrlsUseCase.execute(ids);
  }

  @Delete(':id')
  async deleteFile(@Param() { id }: FileDeletionParamDto) {
    return this.deleteFileUseCase.execute(id);
  }
}
