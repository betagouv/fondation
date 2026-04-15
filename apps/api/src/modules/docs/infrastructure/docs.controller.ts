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
  Post,
  Put,
  Query,
  StreamableFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { Role } from 'shared-models';

import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
} from '@nestjs/swagger';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { DocsService } from '../docs.service';
import {
  CreatedAgendaDto,
  CreatedOfficialReportDto,
  CreateOfficialReportDto,
  CreateOrUpdateAgendaDto,
  FindAgendaNominationFilesQueryDto,
} from './docs.dto';
import { DocsFilter } from './docs.filter';
import { FoundAgendaNominationFiles } from './finders/agenda-nomination-files.finder';
import { DetailedAgendaMetadata } from './queries/details-agenda-metadata.query';
import {
  DetailedSessionAgenda,
  DetailedSessionDoc,
} from './queries/details-session-agenda.query';
import { FoundAgendasForNewOfficialReportDto } from './queries/find-agendas-for-new-official-report.query';
import {
  FoundChairmenDto,
  SearchChairmenQueryDto,
} from './queries/find-chairmen.query';
import {
  CreatedOfficialReportJusticeContactDto,
  CreateOfficialReportJusticeContactDto,
  FoundJusticeContactsDto,
  SearchJusticeContactsQueryDto,
} from './queries/find-justice-contacts.query';
import { FoundMembersForNewOfficialReportDto } from './queries/find-members-for-new-official-report.query';
import { FoundSessionDocsDto } from './queries/find-session-docs.query';
import { DocGenerationSessionReadinessDto } from './queries/is-session-ready-for-doc-generation.query';

@Controller('/api/docs/v1')
@UseInterceptors(DocsFilter)
export class DocsController {
  constructor(private readonly docs: DocsService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/chairmen')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: FoundChairmenDto, status: HttpStatus.OK })
  searchChairmen(
    @Query() query: SearchChairmenQueryDto,
  ): Promise<FoundChairmenDto> {
    return this.docs.searchChairmen({
      formation: query.formation,
    });
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
  @ZodResponse({ type: FoundAgendaNominationFiles, status: HttpStatus.OK })
  findAgendaNominationFiles(
    @Param('sessionId') sessionId: string,
    @Query() { ignoreAgendaId }: FindAgendaNominationFilesQueryDto,
  ): Promise<FoundAgendaNominationFiles> {
    return this.docs.findAgendaNominationFiles({ sessionId, ignoreAgendaId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/sessions/:sessionId/docs')
  @ZodResponse({ type: FoundSessionDocsDto, status: HttpStatus.OK })
  findSessionDocs(
    @Param('sessionId') sessionId: string,
  ): Promise<FoundSessionDocsDto> {
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
    @Query(
      'force',
      new ParseBoolPipe({ optional: true }),
      new DefaultValuePipe(false),
    )
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
    @Query(
      'force',
      new ParseBoolPipe({ optional: true }),
      new DefaultValuePipe(false),
    )
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.docs.getOrCreateAgendaDocumentPdf({ id: agendaId, forceNew });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/agendas/:agendaId')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAgendaMetadata })
  detailsAgendaMetadata(
    @Param('agendaId') agendaId: string,
  ): Promise<DetailedAgendaMetadata> {
    return this.docs.detailsAgendaMetadata({ agendaId });
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
    @Body() body: CreateOfficialReportDto,
  ): Promise<CreatedOfficialReportDto> {
    return this.docs.createOfficialReport({
      sessionId,
      authorId: authUser.id,
      sessionMeetingDate: body.sessionMeetingDate,
      sessionMeetingTime: body.sessionMeetingTime,
      hasRenunciation: body.hasRenunciation,
      justiceDepartmentContactId: body.justiceDepartmentContactId,
      chairmanId: body.chairmanId,
      secretaryId: body.secretaryId,
      agendaIds: body.agendas,
      memberIds: body.members,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/official-reports/justice-contacts')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: FoundJusticeContactsDto, status: HttpStatus.OK })
  searchOfficialReportJusticeContact(
    @Query() query: SearchJusticeContactsQueryDto,
  ): Promise<FoundJusticeContactsDto> {
    return this.docs.searchJusticeContacts({ search: query.search });
  }

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
  @Get('/sessions/:sessionId/new-official-reports/agendas')
  @ZodResponse({
    status: HttpStatus.OK,
    type: FoundAgendasForNewOfficialReportDto,
  })
  listAgendasForNewOfficialReport(
    @Param('sessionId') sessionId: string,
  ): Promise<FoundAgendasForNewOfficialReportDto> {
    return this.docs.listAgendasForNewOfficialReport({ sessionId });
  }

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
  @Get('/sessions/:sessionId/new-official-reports/secretaries-general')
  @ZodResponse({
    status: HttpStatus.OK,
    type: FoundMembersForNewOfficialReportDto,
  })
  listSecretariesForNewOfficialReport(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('sessionId') _sessionId: string,
  ): Promise<FoundMembersForNewOfficialReportDto> {
    return this.docs.listSecretariesGeneralForNewOfficialReport();
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @ApiProduces('text/html')
  @ApiOkResponse({ content: { 'text/html': {} } })
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  @Get('/official-reports/:officialReportId.html')
  generateOfficialReportHtml(
    @Param('officialReportId') officialReportId: string,
    @Query(
      'force',
      new ParseBoolPipe({ optional: true }),
      new DefaultValuePipe(false),
    )
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
    @Query(
      'force',
      new ParseBoolPipe({ optional: true }),
      new DefaultValuePipe(false),
    )
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.docs.getOrCreateOfficialReportDocumentPdf({
      forceNew,
      id: officialReportId,
    });
  }
}
