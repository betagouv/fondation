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
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { ParseBigIntPipe } from 'src/modules/framework/pipes';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { AgendasService } from './agendas.service';
import {
  CreatedAgendaDto,
  CreateOrUpdateAgendaDto,
  EditAgendaFileBlockDto,
  UpdateAgendaFilesDto,
  UpdateAgendaMetadataDto,
} from './infrastructure/agendas.dto';
import { AgendasFilter } from './infrastructure/agendas.filter';
import { DetailedAgendaDocumentBlocksDto } from './infrastructure/queries/details-agenda-document-blocks.query';
import { DetailedAgendaFilesDto } from './infrastructure/queries/details-agenda-files.query';
import { DetailedAgendaMetadata } from './infrastructure/queries/details-agenda-metadata.query';
import { DetailedSessionAgenda } from './infrastructure/queries/details-session-agenda.query';

@ApiTags('Docs')
@Controller('/api/docs/v1')
@UseInterceptors(AgendasFilter)
export class AgendasController {
  constructor(private readonly agendas: AgendasService) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/sessions/:sessionId/agendas')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: CreatedAgendaDto, status: HttpStatus.CREATED })
  createAgenda(
    @AuthedUser() authUser: { id: string },
    @Param('sessionId') sessionId: string,
    @Body() body: CreateOrUpdateAgendaDto,
  ): Promise<CreatedAgendaDto> {
    return this.agendas.createAgenda({
      sessionId,
      date: body.date,
      authorId: authUser.id,
      chairmanId: body.chairmanId,
      nominationFileIds: body.nominationFileIds,
      sessionMeetingDate: body.sessionMeetingDate,
    });
  }

  /**
   * @deprecated Remplacé par `PUT /agendas/:agendaId/metadata` et `PUT /agendas/:agendaId/files`.
   */
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/agendas/:agendaId')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ deprecated: true })
  updateAgenda(
    @Param('agendaId') agendaId: string,
    @AuthedUser() authUser: { id: string },
    @Body() body: CreateOrUpdateAgendaDto,
  ): Promise<void> {
    return this.agendas.updateAgenda({
      agendaId,
      date: body.date,
      authorId: authUser.id,
      chairmanId: body.chairmanId,
      nominationFileIds: body.nominationFileIds,
      sessionMeetingDate: body.sessionMeetingDate,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/agendas/:agendaId/metadata')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAgendaMetadata(
    @Param('agendaId') agendaId: string,
    @AuthedUser() authUser: { id: string },
    @Body() body: UpdateAgendaMetadataDto,
  ): Promise<void> {
    return this.agendas.updateAgendaMetadata({
      agendaId,
      date: body.date,
      authorId: authUser.id,
      chairmanId: body.chairmanId,
      sessionMeetingDate: body.sessionMeetingDate,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/agendas/:agendaId/files')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAgendaFiles(
    @Param('agendaId') agendaId: string,
    @AuthedUser() authUser: { id: string },
    @Body() body: UpdateAgendaFilesDto,
  ): Promise<void> {
    return this.agendas.updateAgendaFiles({
      agendaId,
      authorId: authUser.id,
      nominationFileIds: body.nominationFileIds,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/sessions/:sessionId/agendas/:agendaId')
  @ZodResponse({ type: DetailedSessionAgenda, status: HttpStatus.OK })
  detailsSessionAgenda(
    @Param('sessionId') sessionId: string,
    @Param('agendaId') agendaId: string,
  ): Promise<DetailedSessionAgenda> {
    return this.agendas.detailsSessionAgenda({ sessionId, agendaId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
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
    return this.agendas.getOrCreateAgendaDocument({ id: agendaId, forceNew });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/agendas/:agendaId.pdf')
  @ApiOkResponse({ content: { [FILE_MIME_TYPES.pdf]: {} } })
  @ApiQuery({ name: 'force', required: false, type: 'boolean', default: false })
  generateAgendaPdf(
    @Param('agendaId') agendaId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.agendas.getOrCreateAgendaDocumentPdf({ id: agendaId, forceNew });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/agendas/:agendaId')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAgendaMetadata })
  detailsAgendaMetadata(@Param('agendaId') agendaId: string): Promise<DetailedAgendaMetadata> {
    return this.agendas.detailsAgendaMetadata({ agendaId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/agendas/:agendaId/files')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAgendaFilesDto })
  detailsAgendaFiles(@Param('agendaId') agendaId: string): Promise<DetailedAgendaFilesDto> {
    return this.agendas.detailsAgendaFiles({ agendaId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/agendas/:agendaId/blocks')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAgendaDocumentBlocksDto })
  detailsAgendaDocumentBlocks(@Param('agendaId') agendaId: string): Promise<DetailedAgendaDocumentBlocksDto> {
    return this.agendas.detailsAgendaDocumentBlocks({ agendaId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/agendas/:agendaId/blocks/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  @ApiParam({ name: 'fileId', type: 'integer', format: 'int64' })
  editAgendaFileBlock(
    @Param('agendaId') agendaId: string,
    @Param('fileId', ParseBigIntPipe) fileId: bigint,
    @Body() { html, outdated }: EditAgendaFileBlockDto,
  ): Promise<void> {
    return this.agendas.editAgendaFileBlock({ agendaId, fileId, html, outdated });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/agendas/:agendaId/blocks/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'fileId', type: 'integer', format: 'int64' })
  resetAgendaFileBlock(
    @Param('agendaId') agendaId: string,
    @Param('fileId', ParseBigIntPipe) fileId: bigint,
  ): Promise<void> {
    return this.agendas.resetAgendaFileBlock({ agendaId, fileId });
  }

  /**
   * @deprecated Remplacé par l'édition par bloc (`PATCH /agendas/:agendaId/blocks/files/:fileId`).
   */
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/agendas/:agendaId/html')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    deprecated: true,
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
    return this.agendas.updateAgendaHtml({ id: agendaId, html: file.buffer });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/agendas/:agendaId/document')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetAgendaDocument(@Param('agendaId') agendaId: string): Promise<void> {
    return this.agendas.resetAgendaDocument({ id: agendaId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/agendas/:agendaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAgenda(@Param('agendaId') agendaId: string): Promise<void> {
    return this.agendas.deleteAgenda({ agendaId });
  }
}
