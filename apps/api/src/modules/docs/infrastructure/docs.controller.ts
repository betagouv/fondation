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
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { Role } from 'shared-models';

import { ApiOkResponse, ApiProduces, ApiQuery } from '@nestjs/swagger';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { DocsService } from '../docs.service';
import {
  CreateOrUpdateAgendaDto,
  CreatedAgendaDto,
  FindAgendaNominationFilesQueryDto,
} from './docs.dto';
import { FoundAgendaNominationFiles } from './finders/agenda-nomination-files.finder';
import { DetailedAgendaMetadata } from './queries/details-agenda-metadata.query';
import { DetailedSessionDoc } from './queries/details-session-doc.query';
import {
  FoundChairmenDto,
  SearchChairmenQueryDto,
} from './queries/find-chairmen.query';
import { FoundSessionDocsDto } from './queries/find-session-docs.query';
import { DocGenerationSessionReadinessDto } from './queries/is-session-ready-for-doc-generation.query';

@Controller('/api/docs/v1')
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
  @Get('/sessions/:sessionId/docs/:agendaId')
  @ZodResponse({ type: DetailedSessionDoc, status: HttpStatus.OK })
  detailsSessionDoc(
    @Param('sessionId') sessionId: string,
    @Param('agendaId') agendaId: string,
  ): Promise<DetailedSessionDoc> {
    return this.docs.detailsSessionDoc({ sessionId, agendaId });
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
}
