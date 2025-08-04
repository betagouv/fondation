import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FilesContextRestContract } from 'shared-models';
import { PermissionDeniedError } from 'src/files-context/business-logic/errors/permission-denied.error';
import { DeleteFileUseCase } from 'src/files-context/business-logic/use-cases/file-deletion/delete-file';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';
import { DeleteFilesUseCase } from 'src/files-context/business-logic/use-cases/files-deletion/delete-files';
import { UploadFilesUseCase } from 'src/files-context/business-logic/use-cases/files-upload/upload-files';
import { GenerateFilesUrlsUseCase } from 'src/files-context/business-logic/use-cases/files-url-generation/generate-files-urls';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { FileInterceptor } from 'src/shared-kernel/adapters/primary/nestjs/interceptors/file.interceptor';
import { FilesInterceptor } from 'src/shared-kernel/adapters/primary/nestjs/interceptors/files.interceptor';
import { FileDeletionParamDto } from '../dto/file-deletion.dto';
import { FileUploadQueryDto } from '../dto/file-upload-query.dto';
import { FilesDeletionQueryDto } from '../dto/files-deletion-query.dto';
import { FilesUrlsQueryDto } from '../dto/files-urls-query.dto';
import { FilesUploadQueryDto } from './dto/files-upload-query.dto';

type IReportController = IController<FilesContextRestContract>;

export const baseRoute: FilesContextRestContract['basePath'] = 'api/files';
export const endpointsPaths: IControllerPaths<FilesContextRestContract> = {
  uploadFile: 'upload-one',
  uploadFiles: 'upload-many',
  getSignedUrls: 'signed-urls',
  deleteFile: 'byId/:id',
  deleteFiles: 'byIds',
};

@Controller(baseRoute)
export class FilesController implements IReportController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly uploadFilesUseCase: UploadFilesUseCase,
    private readonly generateFilesUrlsUseCase: GenerateFilesUrlsUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly deleteFilesUseCase: DeleteFilesUseCase,
  ) {}

  @Post(endpointsPaths.uploadFile)
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
      path || null,
    );
  }

  @Post(endpointsPaths.uploadFiles)
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Query() query: FilesUploadQueryDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const { bucket, path, fileIds } = query;

    if (fileIds.length !== files.length) {
      throw new Error('The number of fileIds must match the number of files');
    }

    const fileUploads = files.map((file, index) => ({
      fileId: fileIds[index]!,
      file: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      bucket,
      filePath: path || null,
    }));

    return this.uploadFilesUseCase.execute(fileUploads);
  }

  @Get(endpointsPaths.getSignedUrls)
  async getSignedUrls(
    @Query() { ids }: FilesUrlsQueryDto,
    @Req() request: Request,
  ) {
    const userId = request.userId;
    try {
      return await this.generateFilesUrlsUseCase.execute(ids, userId);
    } catch (error) {
      if (error instanceof PermissionDeniedError) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw error;
    }
  }

  @Delete(endpointsPaths.deleteFile)
  async deleteFile(@Param() query: FileDeletionParamDto) {
    const { id } = query;
    return this.deleteFileUseCase.execute(id);
  }

  @Delete(endpointsPaths.deleteFiles)
  async deleteFiles(@Query() { ids }: FilesDeletionQueryDto) {
    return this.deleteFilesUseCase.execute(ids);
  }
}
