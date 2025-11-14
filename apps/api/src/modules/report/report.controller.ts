import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';

import { ReportFileUsage } from 'shared-models';
import { hasMimeType } from 'src/modules/framework/files';
import { AuthedUserId, HasRole } from 'src/modules/simple-auth';

import {
  DetachReportFilesQueryDto,
  GetReportFileUrlsQueryDto,
} from './infrastructure/dtos/report.dto';
import { ReportService } from './report.service';

@Controller('/api/reports/v2')
export class ReportController {
  constructor(private readonly reports: ReportService) {}

  @Post(':reportId/files')
  @HasRole()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FilesInterceptor('files'))
  attachFiles(
    @Param('reportId') reportId: string,
    @Query('usage') fileUsage: ReportFileUsage,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthedUserId() userId: string,
  ): Promise<void> {
    return this.reports.attachFiles({
      reportId,
      userId,
      fileUsage,
      files: files.filter(hasMimeType('mimetype')).map((file) => ({
        buffer: file.buffer,
        name: file.originalname,
        type: file.mimetype,
      })),
    });
  }

  @Delete(':reportId/files')
  @HasRole()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async detachFiles(
    @Param('reportId') reportId: string,
    @Query() query: DetachReportFilesQueryDto,
    @AuthedUserId() userId: string,
  ) {
    await this.reports.detachFiles({
      userId,
      reportId,
      fileNames: query.fileNames,
    });
  }

  @Get(':reportId/files/url')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  async getReportFilesUrl(
    @AuthedUserId() userId: string,
    @Param('reportId') reportId: string,
    @Query() query: GetReportFileUrlsQueryDto,
  ) {
    return this.reports.getReportFileUrls({
      userId,
      reportId,
      fileNames: query.fileNames,
    });
  }
}
