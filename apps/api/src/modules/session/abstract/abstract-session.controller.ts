import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Multipart, UseMultipartBody } from 'src/modules/framework/files';
import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { HasRole } from 'src/modules/simple-auth';

import { ListGdsNominationSessionsQueryDto, UploadSessionAttachmentsDto } from './abstract-session.dto';
import { AbstractSessionService } from './abstract-session.service';
import { ListedNominationSessionsDto } from './infrastructure/queries/list-sessions.query';

@ApiTags('Sessions')
@Controller('/api/sessions/v2')
export class AbstractSessionController {
  constructor(private readonly sessions: AbstractSessionService) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/garde-des-sceaux')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ type: ListedNominationSessionsDto, status: HttpStatus.OK })
  listSessionsOfTypeGardeDesSceaux(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListGdsNominationSessionsQueryDto,
  ): Promise<ListedNominationSessionsDto> {
    return this.sessions.listSessionsOfTypeGardeDesSceaux({
      pagination,
      search: query.search || null,
      formations: query.formations,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      typeDeSaisine: 'TRANSPARENCE_GDS',
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/attachments')
  @UseMultipartBody({
    schema: UploadSessionAttachmentsDto,
    destination: ({ request, id, ext }) => `sessions/${request.params.sessionId}/${id}.${ext}`,
  })
  async attachFileToSession(
    @Param('sessionId') sessionId: string,
    @Body() { files }: Multipart<typeof UploadSessionAttachmentsDto>,
  ): Promise<void> {
    await this.sessions.attachFiles({ sessionId, files });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/:sessionId/attachments/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async detachFileFromSession(
    @Param('sessionId') sessionId: string,
    @Param('fileId') fileId: string,
  ): Promise<void> {
    await this.sessions.detachFile({ sessionId, fileId });
  }
}
