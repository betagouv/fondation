import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Role } from 'shared-models';

import { DocsService } from '../docs.service';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import {
  CreatedAgendaDto,
  CreatedJusticeContactDto,
  CreatedJusticePresentationPlanDto,
  CreatedOfficialReportDto,
  CreatedOfficialReportJusticeContactDto,
  CreateJusticeContactDto,
  CreateOfficialReportJusticeContactDto,
  CreateOrUpdateAgendaDto,
  CreateOrUpdateJusticePresentationPlanDto,
  CreateOrUpdateOfficialReportDto,
  FindDocsMembersQueryDto,
  FoundDocsMembersDto,
  ListAgendasForNewOfficialReportQueryDto,
  PresentPlanDto,
  SearchJusticeContactsQueryDto,
} from './docs.dto';
import { DocsFilter } from './docs.filter';
import { FoundAgendasDto } from './finders/agenda.finder';
import { FoundDocsNominationFiles } from './finders/docs-nomination-files.finder';
import { DetailedAgendaFilesDto } from './queries/details-agenda-files.query';
import { DetailedAgendaMetadata } from './queries/details-agenda-metadata.query';
import { DetailedOfficialReportMetadataDto } from './queries/details-official-report.query';
import { DetailedPresentationPlanMetadataDto } from './queries/details-presentation-plan-metadata.query';
import { DetailedPresentationPlanPdfDocumentDto } from './queries/details-presentation-plan-pdf-document.query';
import { DetailedSessionAgenda, DetailedSessionDoc } from './queries/details-session-agenda.query';
import { DetailedSessionOfficialReportDto } from './queries/details-session-official-report.query';
import { FoundChairmenDto, SearchChairmenQueryDto } from './queries/find-chairmen.query';
import { FoundJusticeContactsDto } from './queries/find-justice-contacts.query';
import { FoundMembersForNewOfficialReportDto } from './queries/find-members-for-new-official-report.query';
import { FoundSessionDocsDto } from './queries/find-session-docs.query';
import { DocGenerationSessionReadinessDto } from './queries/is-session-ready-for-doc-generation.query';
import { ListedNonPresentedPlansDto } from './queries/list-non-presented-plans.query';
import { ListedPresentedPlansDto } from './queries/list-presented-plans.query';
import { ListedSecretariesGeneralDto } from './queries/list-secretaries-general.query';

@Controller('/api/docs/v1')
@UseInterceptors(DocsFilter)
export class DocsController {
  constructor(private readonly docs: DocsService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/chairmen')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: FoundChairmenDto, status: HttpStatus.OK })
  @ApiOperation({ description: 'prefer find members and use the title' })
  searchChairmen(@Query() query: SearchChairmenQueryDto): Promise<FoundChairmenDto> {
    return this.docs.searchChairmen({
      formation: query.formation,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/secretaries-general')
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedSecretariesGeneralDto,
  })
  listSecretariesGeneral(): Promise<ListedSecretariesGeneralDto> {
    return this.docs.listSecretariesGeneral();
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/sessions/:sessionId/agendas')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: CreatedAgendaDto, status: HttpStatus.CREATED })
  createAgenda(
    @AuthedUser() authUser: { id: string },
    @Param('sessionId') sessionId: string,
    @Body() body: CreateOrUpdateAgendaDto,
  ): Promise<CreatedAgendaDto> {
    return this.docs.createAgenda({
      sessionId,
      date: body.date,
      authorId: authUser.id,
      chairmanId: body.chairmanId,
      nominationFileIds: body.nominationFileIds,
      sessionMeetingDate: body.sessionMeetingDate,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/agendas/:agendaId')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAgenda(
    @Param('agendaId') agendaId: string,
    @AuthedUser() authUser: { id: string },
    @Body() body: CreateOrUpdateAgendaDto,
  ): Promise<void> {
    return this.docs.updateAgenda({
      agendaId,
      date: body.date,
      authorId: authUser.id,
      chairmanId: body.chairmanId,
      nominationFileIds: body.nominationFileIds,
      sessionMeetingDate: body.sessionMeetingDate,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/files')
  @ZodResponse({ type: FoundDocsNominationFiles, status: HttpStatus.OK })
  findAgendaNominationFiles(@Param('sessionId') sessionId: string): Promise<FoundDocsNominationFiles> {
    return this.docs.findAgendaNominationFiles({ sessionId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/docs')
  @ZodResponse({ type: FoundSessionDocsDto, status: HttpStatus.OK })
  findSessionDocs(@Param('sessionId') sessionId: string): Promise<FoundSessionDocsDto> {
    return this.docs.findSessionDocs({ sessionId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/agendas/:agendaId')
  @ZodResponse({ type: DetailedSessionAgenda, status: HttpStatus.OK })
  detailsSessionAgenda(
    @Param('sessionId') sessionId: string,
    @Param('agendaId') agendaId: string,
  ): Promise<DetailedSessionAgenda> {
    return this.docs.detailsSessionAgenda({ sessionId, agendaId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/official-reports/:officialReportId')
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedSessionOfficialReportDto,
  })
  detailsSessionOfficialReport(
    @Param('sessionId') _sessionId: string,
    @Param('officialReportId') officialReportId: string,
  ): Promise<DetailedSessionOfficialReportDto> {
    return this.docs.detailsSessionOfficialReport({ officialReportId });
  }

  // TODO: Remove
  @ApiOperation({ deprecated: true })
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/docs/:agendaId')
  @ZodResponse({ type: DetailedSessionDoc, status: HttpStatus.OK })
  detailsSessionDoc(
    @Param('sessionId') sessionId: string,
    @Param('agendaId') agendaId: string,
  ): Promise<DetailedSessionAgenda> {
    return this.detailsSessionAgenda(sessionId, agendaId);
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/readiness')
  @ZodResponse({
    type: DocGenerationSessionReadinessDto,
    status: HttpStatus.OK,
  })
  isSessionReadyForDocGeneration(
    @Param('sessionId') sessionId: string,
  ): Promise<DocGenerationSessionReadinessDto> {
    return this.docs.isSessionReadyForDocGeneration({ sessionId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/agendas/:agendaId.html')
  @ApiProduces('text/html')
  @ApiOkResponse({ content: { 'text/html': {} } })
  @Header('content-type', 'text/html')
  @ApiQuery({ name: 'force', required: false, type: 'boolean', default: false })
  generateAgendaHtml(
    @Param('agendaId') agendaId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<string> {
    return this.docs.getOrCreateAgendaDocument({ id: agendaId, forceNew });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/agendas/:agendaId.pdf')
  @ApiOkResponse({ content: { [FILE_MIME_TYPES.pdf]: {} } })
  @ApiQuery({ name: 'force', required: false, type: 'boolean', default: false })
  generateAgendaPdf(
    @Param('agendaId') agendaId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.docs.getOrCreateAgendaDocumentPdf({ id: agendaId, forceNew });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/agendas/:agendaId')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAgendaMetadata })
  detailsAgendaMetadata(@Param('agendaId') agendaId: string): Promise<DetailedAgendaMetadata> {
    return this.docs.detailsAgendaMetadata({ agendaId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/agendas/:agendaId/files')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAgendaFilesDto })
  detailsAgendaFiles(@Param('agendaId') agendaId: string): Promise<DetailedAgendaFilesDto> {
    return this.docs.detailsAgendaFiles({ agendaId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Patch('/agendas/:agendaId/html')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    requestBody: {
      content: {
        'multipart/form-data': {
          encoding: { html: { contentType: 'text/html' } },
          schema: { type: 'object', properties: { html: { type: 'string', format: 'binary' } } },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('html', {
      limits: { fileSize: 5_242_880 /* 5Mo */ },
      fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'text/html'),
    }),
  )
  updateAgendaHtml(
    @Param('agendaId') agendaId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.docs.updateAgendaHtml({ id: agendaId, html: file.buffer });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/agendas/:agendaId/document')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetAgendaDocument(@Param('agendaId') agendaId: string): Promise<void> {
    return this.docs.resetAgendaDocument({ id: agendaId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/agendas/:agendaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAgenda(@Param('agendaId') agendaId: string): Promise<void> {
    return this.docs.deleteAgenda({ agendaId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/sessions/:sessionId/official-reports')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: CreatedOfficialReportDto, status: HttpStatus.CREATED })
  createOfficialReport(
    @Param('sessionId') sessionId: string,
    @AuthedUser() authUser: { id: string },
    @Body() body: CreateOrUpdateOfficialReportDto,
  ): Promise<CreatedOfficialReportDto> {
    return this.docs.createOfficialReport({
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

  @ApiOperation({ deprecated: true, description: 'prefer generic query searchJusticeContact' })
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/official-reports/justice-contacts')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: FoundJusticeContactsDto, status: HttpStatus.OK })
  searchOfficialReportJusticeContact(
    @Query() query: SearchJusticeContactsQueryDto,
  ): Promise<FoundJusticeContactsDto> {
    return this.docs.searchJusticeContacts({ search: query.search });
  }

  @ApiOperation({ deprecated: true, description: 'prefer generic query createJusticeContact' })
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/official-reports/justice-contacts')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedOfficialReportJusticeContactDto,
  })
  createOfficialReportJusticeContact(
    @AuthedUser() user: { id: string },
    @Body() { name }: CreateOfficialReportJusticeContactDto,
  ): Promise<CreatedOfficialReportJusticeContactDto> {
    return this.docs.createJusticeContact({ name, authorId: user.id });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/justice-contacts')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: FoundJusticeContactsDto, status: HttpStatus.OK })
  searchJusticeContact(@Query() query: SearchJusticeContactsQueryDto): Promise<FoundJusticeContactsDto> {
    return this.docs.searchJusticeContacts({ search: query.search });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/justice-contacts')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedJusticeContactDto,
  })
  createJusticeContact(
    @AuthedUser() user: { id: string },
    @Body() { name }: CreateJusticeContactDto,
  ): Promise<CreatedJusticeContactDto> {
    return this.docs.createJusticeContact({ name, authorId: user.id });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/new-official-reports/agendas')
  @ZodResponse({
    status: HttpStatus.OK,
    type: FoundAgendasDto,
  })
  listAgendasForNewOfficialReport(
    @Param('sessionId') sessionId: string,
    @Query() query: ListAgendasForNewOfficialReportQueryDto,
  ): Promise<FoundAgendasDto> {
    return this.docs.listAgendasForNewOfficialReport({
      sessionId,
      ignoreOfficialReportId: query.ignoreOfficialReportId,
    });
  }

  @ApiOperation({ deprecated: true, description: 'prefer find members by formation' })
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/new-official-reports/members')
  @ZodResponse({
    status: HttpStatus.OK,
    type: FoundMembersForNewOfficialReportDto,
  })
  listMembersForNewOfficialReport(
    @Param('sessionId') sessionId: string,
  ): Promise<FoundMembersForNewOfficialReportDto> {
    return this.docs.listMembersForNewOfficialReport({ sessionId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @ApiProduces('text/html')
  @ApiOkResponse({ content: { 'text/html': {} } })
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  @Get('/official-reports/:officialReportId.html')
  generateOfficialReportHtml(
    @Param('officialReportId') officialReportId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<string> {
    return this.docs.getOrCreateOfficialReportDocument({
      forceNew,
      id: officialReportId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @ApiProduces(FILE_MIME_TYPES.pdf)
  @ApiOkResponse({ content: { [FILE_MIME_TYPES.pdf]: {} } })
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  @Get('/official-reports/:officialReportId.pdf')
  generateOfficialReportPdf(
    @Param('officialReportId') officialReportId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.docs.getOrCreateOfficialReportDocumentPdf({
      forceNew,
      id: officialReportId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/official-reports/:officialReportId')
  @ZodResponse({
    type: DetailedOfficialReportMetadataDto,
    status: HttpStatus.OK,
  })
  detailsOfficialReport(
    @Param('officialReportId') officialReportId: string,
  ): Promise<DetailedOfficialReportMetadataDto> {
    return this.docs.detailsOfficialReportMetadata({ officialReportId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/official-reports/:officialReportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateOfficialReport(
    @Param('officialReportId') officialReportId: string,
    @AuthedUser() authUser: { id: string },
    @Body() body: CreateOrUpdateOfficialReportDto,
  ): Promise<void> {
    await this.docs.updateOfficialReport({
      id: officialReportId,
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

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Patch('/official-reports/:officialReportId/html')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    requestBody: {
      content: {
        'multipart/form-data': {
          encoding: { html: { contentType: 'text/html' } },
          schema: { type: 'object', properties: { html: { type: 'string', format: 'binary' } } },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('html', {
      limits: { fileSize: 5_242_880 /* 5Mo */ },
      fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'text/html'),
    }),
  )
  updateOfficialReportHtml(
    @Param('officialReportId') officialReportId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.docs.updateOfficialReportHtml({ id: officialReportId, html: file.buffer });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/official-reports/:officialReportId/document')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetOfficialReportDocument(@Param('officialReportId') officialReportId: string): Promise<void> {
    return this.docs.resetOfficialReportDocument({ id: officialReportId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/official-reports/:officialReportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOfficialReport(@Param('officialReportId') officialReportId: string): Promise<void> {
    await this.docs.deleteOfficialReport({ id: officialReportId });
  }

  @Get('/presentation-plans/agendas')
  @ApiQuery({ name: 'ignore', required: false, type: 'string', format: 'uuid' })
  @ZodResponse({ status: HttpStatus.OK, type: FoundAgendasDto })
  listPresentationPlanAgendas(
    @Query('ignore', new ParseUUIDPipe({ optional: true }))
    ignorePlanId: string | undefined,
  ): Promise<FoundAgendasDto> {
    return this.docs.findPresentationPlanAgendas({ ignorePlanId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/presentation-plans/:planId.html')
  @ApiProduces('text/html')
  @ApiResponse({ content: { 'text/html': {} } })
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  generatePresentationPlanHtml(
    @Param('planId') planId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<string> {
    return this.docs.findPresentationPlanDocument({
      forceNew,
      id: planId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/presentation-plans/:planId.pdf')
  @ApiProduces(FILE_MIME_TYPES.pdf)
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  generatePresentationPlanPdf(
    @Param('planId') planId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.docs.findPresentationPlanDocumentPdf({
      forceNew,
      id: planId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/presentation-plans/presented')
  @ApiPaginated()
  @ZodResponse({ type: ListedPresentedPlansDto, status: HttpStatus.OK })
  listPresentedPlans(@QueryPagination() pagination: Pagination): Promise<ListedPresentedPlansDto> {
    return this.docs.listPresentedPlans({ pagination });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/presentation-plans/:planId')
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedPresentationPlanMetadataDto,
  })
  detailsPresentationPlanMetadata(
    @Param('planId') planId: string,
  ): Promise<DetailedPresentationPlanMetadataDto> {
    return this.docs.detailsPresentationPlanMetadata({ id: planId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/presentation-plans')
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedJusticePresentationPlanDto,
  })
  @UsePipes(ZodValidationPipe)
  createJusticePresentationPlan(
    @Body() body: CreateOrUpdateJusticePresentationPlanDto,
    @AuthedUser() user: { id: string },
  ): Promise<CreatedJusticePresentationPlanDto> {
    return this.docs.createPresentationPlan({ ...body, authorId: user.id });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/presentation-plans/:planId')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateJusticePresentationPlan(
    @Param('planId') planId: string,
    @Body() body: CreateOrUpdateJusticePresentationPlanDto,
    @AuthedUser() user: { id: string },
  ): Promise<void> {
    return this.docs.updatePresentationPlan({
      ...body,
      id: planId,
      authorId: user.id,
      endingTime: body.endingTime ?? null,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/presentation-plans/:planId/url')
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedPresentationPlanPdfDocumentDto,
  })
  detailsJusticePresentationPlanPdfDocument(
    @Param('planId') planId: string,
  ): Promise<DetailedPresentationPlanPdfDocumentDto> {
    return this.docs.detailsPresentationPlanPdfDocument({ id: planId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Patch('/presentation-plans/:planId/html')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    requestBody: {
      content: {
        'multipart/form-data': {
          encoding: { html: { contentType: 'text/html' } },
          schema: { type: 'object', properties: { html: { type: 'string', format: 'binary' } } },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('html', {
      limits: { fileSize: 5_242_880 /* 5Mo */ },
      fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'text/html'),
    }),
  )
  updatePresentationPlanHtml(
    @Param('planId') planId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.docs.updatePresentationPlanHtml({ id: planId, html: file.buffer });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/presentation-plans/:planId/document')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPresentationPlanDocument(@Param('planId') planId: string): Promise<void> {
    return this.docs.resetPresentationPlanDocument({ id: planId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/presentation-plans/:planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteJusticePresentationPlan(@Param('planId') planId: string): Promise<void> {
    return this.docs.deletePresentationPlan({ id: planId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/presentation-plans')
  @ZodResponse({ type: ListedNonPresentedPlansDto, status: HttpStatus.OK })
  listNonPresentedPlans(): Promise<ListedNonPresentedPlansDto> {
    return this.docs.listNonPresentedPlans();
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/presentation-plans/:planId/presentation')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  presentPlan(@Param('planId') planId: string, @Body() body: PresentPlanDto): Promise<void> {
    return this.docs.presentPlan({ id: planId, endTime: body.endTime });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/presentation-plans/:planId/presentation')
  @HttpCode(HttpStatus.NO_CONTENT)
  unPresentPlan(@Param('planId') planId: string): Promise<void> {
    return this.docs.unPresentPlan({ id: planId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/members')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: FoundDocsMembersDto })
  findDocsMembers(@Query() query: FindDocsMembersQueryDto): Promise<FoundDocsMembersDto> {
    return this.docs.findDocsMembers(query);
  }
}
