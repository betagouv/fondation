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
import { FilesContextRestContract } from 'shared-models';
import { DeleteFileUseCase } from 'src/files-context/business-logic/use-cases/file-deletion/delete-file';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';
import { GenerateFilesUrlsUseCase } from 'src/files-context/business-logic/use-cases/files-url-generation/generate-files-urls';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { FileDeletionParamDto } from '../dto/file-deletion.dto';
import { FileUploadQueryDto } from '../dto/file-upload-query.dto';
import { FilesUrlsQueryDto } from '../dto/files-urls-query.dto';
import { FileInterceptor } from 'src/shared-kernel/adapters/primary/nestjs/interceptors/file.interceptor';

type IReportController = IController<FilesContextRestContract>;

const baseRoute: FilesContextRestContract['basePath'] = 'api/files';
const endpointsPaths: IControllerPaths<FilesContextRestContract> = {
  uploadFile: 'upload-one',
  getSignedUrls: 'signed-urls',
  deleteFile: ':id',
};

@Controller(baseRoute)
export class FilesController implements IReportController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly generateFilesUrlsUseCase: GenerateFilesUrlsUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
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

  @Get(endpointsPaths.getSignedUrls)
  async getSignedUrls(@Query() { ids }: FilesUrlsQueryDto) {
    return this.generateFilesUrlsUseCase.execute(ids);
  }

  @Delete(endpointsPaths.deleteFile)
  async deleteFile(@Param() query: FileDeletionParamDto) {
    const { id } = query;
    return this.deleteFileUseCase.execute(id);
  }
}
