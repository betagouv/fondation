import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FILE_EXTENSIONS, UseMultipartBody, type Multipart } from '../framework/files';
import type { Impersonation } from '../shared/policies/personal-content.policies';
import { MEMBER_ROLES, type RoleEnum } from '../shared/role.enum';
import { AuthedUser, HasRole } from '../simple-auth';

import {
  AttachedScreenshotsDto,
  AttachReportFileDto,
  AttachReportFileQueryDto,
  AttachScreenshotsDto,
  UpdateReportDto,
  UpdateReportRuleValidationDto,
} from './infrastructure/dtos/report.dto';
import { DetailedReportDto } from './infrastructure/queries/detail-report.query';
import { GeneratedReportAttachmentUrlDto } from './infrastructure/queries/get-report-attachment-url.query';
import { ReportService } from './report.service';

@ApiTags('Reports')
@Controller('/api/reports/v2')
export class ReportController {
  constructor(private readonly reports: ReportService) {}

  @Post('/:reportId/files')
  @HasRole(...MEMBER_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    destination: ({ request, id, mimetype }) =>
      `reports/${request.params.reportId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    schema: AttachReportFileDto,
  })
  attachFiles(
    @Param('reportId') reportId: string,
    @Query(ZodValidationPipe) query: AttachReportFileQueryDto,
    @Body() { files }: Multipart<typeof AttachReportFileDto>,
    @AuthedUser() user: { id: string; impersonation: Impersonation | undefined },
  ): Promise<void> {
    return this.reports.attachFiles({
      fileUsage: query.usage,
      files,
      impersonation: user.impersonation,
      reportId,
      userId: user.id,
    });
  }

  @Delete('/:reportId/files/:fileId')
  @HasRole(...MEMBER_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  async detachAttachment(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @AuthedUser() user: { id: string; impersonation: Impersonation | undefined },
  ): Promise<void> {
    await this.reports.detachAttachment({
      fileId,
      impersonation: user.impersonation,
      reportId,
      userId: user.id,
    });
  }

  @Post('/:reportId/screenshots')
  @HasRole(...MEMBER_ROLES)
  @UseMultipartBody({
    schema: AttachScreenshotsDto,
    destination: ({ id, mimetype, request }) =>
      `reports/${request.params.reportId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @ZodResponse({ status: HttpStatus.OK, type: AttachedScreenshotsDto })
  async attachScreenshots(
    @Param('reportId') reportId: string,
    @Body() { files }: Multipart<typeof AttachScreenshotsDto>,
    @AuthedUser() user: { id: string; impersonation: Impersonation | undefined },
  ): Promise<AttachedScreenshotsDto> {
    return this.reports.attachScreenshots({
      files,
      impersonation: user.impersonation,
      reportId,
      userId: user.id,
    });
  }

  @Get('/:reportId/files/:fileId/url')
  @HasRole(...MEMBER_ROLES)
  @ZodResponse({ type: GeneratedReportAttachmentUrlDto, status: HttpStatus.OK })
  getAttachmentUrl(
    @AuthedUser() user: { id: string; impersonation: Impersonation | undefined; role: RoleEnum },
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<GeneratedReportAttachmentUrlDto> {
    return this.reports.getAttachmentUrl({ fileId, reportId, user });
  }

  @Get('/:reportId')
  @HasRole()
  @ZodResponse({ type: DetailedReportDto, status: HttpStatus.OK })
  async detailReport(
    @Param('reportId') reportId: string,
    @AuthedUser() user: { id: string; impersonation: Impersonation | undefined; role: RoleEnum },
  ): Promise<DetailedReportDto> {
    return this.reports.detailReport({ user, reportId });
  }

  @Patch('/:reportId')
  @HasRole(...MEMBER_ROLES)
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateReport(
    @Param('reportId') reportId: string,
    @AuthedUser() user: { id: string; impersonation: Impersonation | undefined },
    @Body() { comment, status }: UpdateReportDto,
  ) {
    await this.reports.updateReport({
      data: { comment, status },
      impersonation: user.impersonation,
      reportId,
      reporterId: user.id,
    });
  }

  @Put('/:reportId/rules/:ruleId')
  @HasRole(...MEMBER_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateReportRuleValidation(
    @AuthedUser() user: { id: string; impersonation: Impersonation | undefined },
    @Param('reportId') reportId: string,
    @Param('ruleId') ruleId: string,
    @Body() { isValidated }: UpdateReportRuleValidationDto,
  ) {
    await this.reports.updateRuleValidation({
      impersonation: user.impersonation,
      isValidated,
      reportId,
      reporterId: user.id,
      ruleId,
    });
  }
}
