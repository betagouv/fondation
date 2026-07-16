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
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FILE_EXTENSIONS, UseMultipartBody, type Multipart } from '../framework/files';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, AuthedUserId, HasRole } from 'src/modules/simple-auth';

import {
  AttachedScreenshotsDto,
  AttachReportFileDto,
  AttachReportFileQueryDto,
  AttachScreenshotsDto,
  DetachReportFilesQueryDto,
  GetReportFileUrlsQueryDto,
  UpdateReportDto,
  UpdateReportRuleValidationDto,
} from './infrastructure/dtos/report.dto';
import { DetailedReportDto } from './infrastructure/queries/detail-report.query';
import { GetReportFileUrlsResponseDto } from './infrastructure/queries/get-report-file-urls.query';
import { ReportService } from './report.service';

@ApiTags('Reports')
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
    @Query(ZodValidationPipe) query: AttachReportFileQueryDto,
    @Body() { files }: Multipart<typeof AttachReportFileDto>,
    @AuthedUserId() userId: string,
  ): Promise<void> {
    return this.reports.attachFiles({
      reportId,
      userId,
      fileUsage: query.usage,
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

  @Post('/:reportId/screenshots')
  @HasRole()
  @UseMultipartBody({
    schema: AttachScreenshotsDto,
    destination: ({ id, mimetype, request }) =>
      `reports/${request.params.reportId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @ZodResponse({ status: HttpStatus.OK, type: AttachedScreenshotsDto })
  async attachScreenshots(
    @Param('reportId') reportId: string,
    @Body() { files }: Multipart<typeof AttachScreenshotsDto>,
    @AuthedUser() user: { id: string },
  ): Promise<AttachedScreenshotsDto> {
    return this.reports.attachScreenshots({
      files,
      reportId,
      userId: user.id,
    });
  }

  @Get('/:reportId/files/url')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: GetReportFileUrlsResponseDto, status: HttpStatus.OK })
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
  @ZodResponse({ type: DetailedReportDto, status: HttpStatus.OK })
  async detailReport(
    @Param('reportId') reportId: string,
    @AuthedUser() user: { id: string; role: RoleEnum },
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
