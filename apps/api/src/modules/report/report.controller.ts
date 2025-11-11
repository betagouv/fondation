import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { ReportFileUsage } from 'shared-models';
import { hasMimeType } from 'src/modules/framework/files';
import { AuthedUserId, HasRole } from 'src/modules/simple-auth';

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
}
