import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ReportFileUsage, Role } from 'shared-models';
import { AuthedUser, AuthedUserId, HasRole } from 'src/modules/simple-auth';

import {
  AttachReportFileDto,
  DetachReportFilesQueryDto,
  GetReportFileUrlsQueryDto,
  UpdateReportDto,
  UpdateReportRuleValidationDto,
} from './infrastructure/dtos/report.dto';
import { DetailedReportDto } from './infrastructure/queries/detail-report.query';
import { ReportService } from './report.service';
import {
  FILE_EXTENSIONS,
  UseMultipartBody,
  type Multipart,
} from '../framework/files';

@Controller('/api/reports/v2')
export class ReportController {
  constructor(private readonly reports: ReportService) {}

  @Post('/:reportId/files')
  @HasRole()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    schema: AttachReportFileDto,
    destination: ({ request, id, mimetype }) =>
      `reports/${request.params.reportId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  attachFiles(
    @Param('reportId') reportId: string,
    @Query('usage') fileUsage: ReportFileUsage,
    @Body() { files }: Multipart<typeof AttachReportFileDto>,
    @AuthedUserId() userId: string,
  ): Promise<void> {
    return this.reports.attachFiles({
      reportId,
      userId,
      fileUsage,
      files,
    });
  }

  @Delete('/:reportId/files')
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

  @Get('/:reportId/files/url')
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

  @Get('/:reportId')
  @HasRole()
  async detailReport(
    @Param('reportId') reportId: string,
    @AuthedUser() user: { id: string; role: Role },
  ): Promise<DetailedReportDto> {
    return this.reports.detailReport({ user, reportId });
  }

  @Patch('/:reportId')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateReport(
    @Param('reportId') reportId: string,
    @AuthedUserId() reporterId: string,
    @Body() { comment, status }: UpdateReportDto,
  ) {
    await this.reports.updateReport({
      reportId,
      reporterId,
      data: { comment, status },
    });
  }

  @Put('/:reportId/rules/:ruleId')
  @HasRole()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateReportRuleValidation(
    @AuthedUserId() reporterId: string,
    @Param('reportId') reportId: string,
    @Param('ruleId') ruleId: string,
    @Body() { isValidated }: UpdateReportRuleValidationDto,
  ) {
    await this.reports.updateRuleValidation({
      ruleId,
      reportId,
      reporterId,
      isValidated,
    });
  }
}
