import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { DocNominationFileOutcomeEnum } from '../shared/domain/doc-nomination-file-outcome';
import { FoundAgendasDto } from '../shared/infrastructure/finders/agenda.finder';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import {
  CreatedOfficialReportDto,
  CreateOfficialReportDto,
  DetailedOfficialReportDocumentDto,
  EditOfficialReportBlockDto,
  EditOfficialReportSectionIntroBlockDto,
  EditOfficialReportSectionTitleDto,
  ListAgendasForNewOfficialReportQueryDto,
  UpdateOfficialReportDto,
} from './infrastructure/official-reports.dto';
import { OfficialReportsFilter } from './infrastructure/official-reports.filter';
import { DetailedOfficialReportMetadataDto } from './infrastructure/queries/details-official-report.query';
import { DetailedSessionOfficialReportDto } from './infrastructure/queries/details-session-official-report.query';
import { OfficialReportsService } from './official-reports.service';

@ApiTags('Docs')
@Controller('/api/docs/v1')
@UseInterceptors(OfficialReportsFilter)
export class OfficialReportsController {
  constructor(private readonly officialReports: OfficialReportsService) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/sessions/:sessionId/official-reports/:officialReportId')
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedSessionOfficialReportDto,
  })
  detailsSessionOfficialReport(
    @Param('sessionId') _sessionId: string,
    @Param('officialReportId') officialReportId: string,
  ): Promise<DetailedSessionOfficialReportDto> {
    return this.officialReports.detailsSessionOfficialReport({ officialReportId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/sessions/:sessionId/official-reports')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: CreatedOfficialReportDto, status: HttpStatus.CREATED })
  createOfficialReport(
    @Param('sessionId') sessionId: string,
    @AuthedUser() authUser: { id: string },
    @Body() body: CreateOfficialReportDto,
  ): Promise<CreatedOfficialReportDto> {
    return this.officialReports.createOfficialReport({
      sessionId,
      authorId: authUser.id,
      sessionMeetingDate: body.sessionMeetingDate,
      sessionMeetingTime: body.sessionMeetingTime,
      sessionMeetingEndingTime: body.sessionMeetingEndingTime,
      hasRenunciation: body.hasRenunciation,
      justiceDepartmentContactId: body.justiceDepartmentContactId,
      chairmanId: body.chairmanId,
      secretaryId: body.secretaryId,
      agendaIds: body.agendas,
      absentMemberIds: body.absentMemberIds,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/sessions/:sessionId/new-official-reports/agendas')
  @ZodResponse({
    status: HttpStatus.OK,
    type: FoundAgendasDto,
  })
  listAgendasForNewOfficialReport(
    @Param('sessionId') sessionId: string,
    @Query() query: ListAgendasForNewOfficialReportQueryDto,
  ): Promise<FoundAgendasDto> {
    return this.officialReports.listAgendasForNewOfficialReport({
      sessionId,
      ignoreOfficialReportId: query.ignoreOfficialReportId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ApiProduces('text/html')
  @ApiOkResponse({ content: { 'text/html': {} } })
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  @Get('/official-reports/:officialReportId.html')
  generateOfficialReportHtml(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<string> {
    return this.officialReports.getOrCreateOfficialReportDocument({
      forceNew,
      id: officialReportId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ApiProduces(FILE_MIME_TYPES.pdf)
  @ApiOkResponse({ content: { [FILE_MIME_TYPES.pdf]: {} } })
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  @Get('/official-reports/:officialReportId.pdf')
  generateOfficialReportPdf(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.officialReports.getOrCreateOfficialReportDocumentPdf({
      forceNew,
      id: officialReportId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/official-reports/:officialReportId')
  @ZodResponse({
    type: DetailedOfficialReportMetadataDto,
    status: HttpStatus.OK,
  })
  detailsOfficialReport(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
  ): Promise<DetailedOfficialReportMetadataDto> {
    return this.officialReports.detailsOfficialReportMetadata({ officialReportId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/official-reports/:officialReportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateOfficialReport(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Body() body: UpdateOfficialReportDto,
  ): Promise<void> {
    await this.officialReports.updateOfficialReport({
      id: officialReportId,
      authorId: authUser.id,
      sessionMeetingDate: body.sessionMeetingDate,
      sessionMeetingTime: body.sessionMeetingTime,
      sessionMeetingEndingTime: body.sessionMeetingEndingTime,
      hasRenunciation: body.hasRenunciation,
      justiceDepartmentContactId: body.justiceDepartmentContactId,
      chairmanId: body.chairmanId,
      secretaryId: body.secretaryId,
      absentMemberIds: body.absentMemberIds,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/official-reports/:officialReportId/validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  validateOfficialReport(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
  ): Promise<void> {
    return this.officialReports.validateOfficialReport({ id: officialReportId, authorId: authUser.id });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/official-reports/:officialReportId/draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  discardOfficialReportDraft(@Param('officialReportId') officialReportId: string): Promise<void> {
    return this.officialReports.discardOfficialReportDraft({ id: officialReportId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/official-reports/:officialReportId/blocks')
  @ZodResponse({ type: DetailedOfficialReportDocumentDto, status: HttpStatus.OK })
  detailsOfficialReportDocument(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
  ): Promise<DetailedOfficialReportDocumentDto> {
    return this.officialReports.detailsOfficialReportDocument({ id: officialReportId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/official-reports/:officialReportId/blocks/intro')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  editOfficialReportIntro(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Body() body: EditOfficialReportBlockDto,
  ): Promise<void> {
    return this.officialReports.editOfficialReportIntro({
      authorId: authUser.id,
      id: officialReportId,
      html: body.html,
      outdated: body.outdated,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/official-reports/:officialReportId/blocks/intro')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetOfficialReportIntro(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
  ): Promise<void> {
    return this.officialReports.resetOfficialReportIntro({ authorId: authUser.id, id: officialReportId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/official-reports/:officialReportId/blocks/conclusion')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  editOfficialReportConclusion(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Body() body: EditOfficialReportBlockDto,
  ): Promise<void> {
    return this.officialReports.editOfficialReportConclusion({
      authorId: authUser.id,
      id: officialReportId,
      html: body.html,
      outdated: body.outdated,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/official-reports/:officialReportId/blocks/conclusion')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetOfficialReportConclusion(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
  ): Promise<void> {
    return this.officialReports.resetOfficialReportConclusion({
      authorId: authUser.id,
      id: officialReportId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/official-reports/:officialReportId/blocks/:outcome/title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  @ApiParam({ name: 'outcome', enum: DocNominationFileOutcomeEnum })
  editOfficialReportSectionTitle(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Param('outcome', new ParseEnumPipe(DocNominationFileOutcomeEnum))
    outcome: DocNominationFileOutcomeEnum,
    @Body() body: EditOfficialReportSectionTitleDto,
  ): Promise<void> {
    return this.officialReports.editOfficialReportSectionTitle({
      authorId: authUser.id,
      id: officialReportId,
      outcome,
      text: body.text,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/official-reports/:officialReportId/blocks/:outcome/title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'outcome', enum: DocNominationFileOutcomeEnum })
  resetOfficialReportSectionTitle(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Param('outcome', new ParseEnumPipe(DocNominationFileOutcomeEnum))
    outcome: DocNominationFileOutcomeEnum,
  ): Promise<void> {
    return this.officialReports.resetOfficialReportSectionTitle({
      authorId: authUser.id,
      id: officialReportId,
      outcome,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/official-reports/:officialReportId/blocks/:outcome/intro')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  @ApiParam({ name: 'outcome', enum: DocNominationFileOutcomeEnum })
  editOfficialReportSectionIntro(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Param('outcome', new ParseEnumPipe(DocNominationFileOutcomeEnum))
    outcome: DocNominationFileOutcomeEnum,
    @Body() body: EditOfficialReportSectionIntroBlockDto,
  ): Promise<void> {
    return this.officialReports.editOfficialReportSectionIntro({
      authorId: authUser.id,
      outcome,
      html: body.html,
      id: officialReportId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/official-reports/:officialReportId/blocks/:outcome/intro')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'outcome', enum: DocNominationFileOutcomeEnum })
  resetOfficialReportSectionIntro(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Param('outcome', new ParseEnumPipe(DocNominationFileOutcomeEnum))
    outcome: DocNominationFileOutcomeEnum,
  ): Promise<void> {
    return this.officialReports.resetOfficialReportSectionIntro({
      authorId: authUser.id,
      id: officialReportId,
      outcome,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/official-reports/:officialReportId/blocks/files/:nominationFileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  editOfficialReportFile(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: EditOfficialReportBlockDto,
  ): Promise<void> {
    return this.officialReports.editOfficialReportFile({
      authorId: authUser.id,
      id: officialReportId,
      nominationFileId,
      html: body.html,
      outdated: body.outdated,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/official-reports/:officialReportId/blocks/files/:nominationFileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetOfficialReportFile(
    @AuthedUser() authUser: { id: string },
    @Param('officialReportId') officialReportId: string,
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<void> {
    return this.officialReports.resetOfficialReportFile({
      authorId: authUser.id,
      id: officialReportId,
      nominationFileId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/official-reports/:officialReportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOfficialReport(@Param('officialReportId') officialReportId: string): Promise<void> {
    await this.officialReports.deleteOfficialReport({ id: officialReportId });
  }
}
