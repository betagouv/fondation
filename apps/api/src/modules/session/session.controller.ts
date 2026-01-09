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
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Role, TypeDeSaisine } from 'shared-models';

import { AuthedUser, AuthedUserId, HasRole } from 'src/modules/simple-auth';

import { type NominationFile } from './domain/nomination-file';
import { LodamXlsxPipe } from './infrastructure/lodam-xlsx.pipe';
import { SessionExceptionFilter } from './infrastructure/session.filter';
import { SessionService } from './infrastructure/sessions.service';

import { ApiTags } from '@nestjs/swagger';
import { DateOnly } from 'src/utils/date-only';
import {
  FILE_EXTENSIONS,
  UseMultipartBody,
  type Multipart,
} from '../framework/files';
import { AutoAffectationDto } from './infrastructure/dtos/auto-affectation.dto';
import {
  AffectReportersDto,
  ListNominationFilesQueryDto,
  UpdateCommentAccessDto,
  UpdateCommentDto,
} from './infrastructure/dtos/nomination-file.dto';
import {
  CreatedNominationSessionDto,
  DefineNominationFileOutcomeDto,
  ImportNominationSessionFromLodamXlsxDto,
  ListCommentAccessDto,
  UpdateNominationSessionDto,
  UpdateNominationSessionFilesObserversDto,
  UploadSessionAttachmentDto,
} from './infrastructure/dtos/nomination-session.dto';
import { FoundAffectationVersion } from './infrastructure/finders/affectation-version.finder';
import {
  ApiPaginated,
  Pagination,
  QueryPagination,
} from '../framework/pagination';
import { DetailedNominationSessionAttachmentDto } from './infrastructure/queries/detail-nomination-session-attachment.query';
import { DetailedNominationSessionDto } from './infrastructure/queries/detail-nomination-session.query';
import { PaginatedNominationFileAffectationItem } from './infrastructure/queries/list-nomination-files.query';
import { ListedNominationSessionAttachmentDto } from './infrastructure/queries/list-nomination-session-attachments.query';
import { PaginatedNominationSessionsDto } from './infrastructure/queries/list-nomination-sessions.query';

@ApiTags('Sessions')
@UseInterceptors(SessionExceptionFilter)
@Controller('/api/sessions/v2')
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  @HasRole()
  @Get('/garde-des-sceaux')
  @ApiPaginated()
  @ZodResponse({ type: PaginatedNominationSessionsDto, status: HttpStatus.OK })
  listSessionsOfTypeGardeDesSceaux(
    @QueryPagination() pagination: Pagination,
  ): Promise<PaginatedNominationSessionsDto> {
    return this.sessions.listNominationSessions({
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
      pagination,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/lodam')
  @UseMultipartBody({
    overrideFiles: false,
    deleteOnFail: false,
    schema: ImportNominationSessionFromLodamXlsxDto,
    destination: ({ id, mimetype }) =>
      `lodam/${new Date().toISOString()}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @ZodResponse({
    type: CreatedNominationSessionDto,
    status: HttpStatus.CREATED,
  })
  async createSessionFromLodam(
    @Body(LodamXlsxPipe)
    files: NominationFile[],
    @Body()
    { form }: ImportNominationSessionFromLodamXlsxDto,
  ): Promise<CreatedNominationSessionDto> {
    return this.sessions.createNominationSessionFromLodam({
      ...form,
      files,
      dueDate: form.dueDate ?? null,
      positionStartDate: form.positionStartDate ?? null,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/lodam/:sessionId/observers')
  @UseMultipartBody({
    overrideFiles: false,
    deleteOnFail: false,
    schema: UpdateNominationSessionFilesObserversDto,
    destination: ({ id, mimetype }) =>
      `lodam/${new Date().toISOString()}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateSessionObservers(
    @Param('sessionId') sessionId: string,
    @Body(LodamXlsxPipe)
    files: NominationFile[],
  ) {
    await this.sessions.updateSessionNominationFileObservers({
      sessionId,
      files,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/:sessionId/files/reporters')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async affectReporters(
    @Param('sessionId') sessionId: string,
    @Body() body: AffectReportersDto,
  ): Promise<void> {
    await this.sessions.affectReportersAndPriorities({
      sessionId,
      affectations: body.items,
    });
  }

  @HasRole()
  @Get('/:sessionId/files')
  @ApiPaginated()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    type: PaginatedNominationFileAffectationItem,
    status: HttpStatus.OK,
  })
  listNominationFiles(
    @Param('sessionId') sessionId: string,
    @AuthedUser() user: { id: string; role: Role },
    @QueryPagination() pagination: Pagination,
    @Query() query: ListNominationFilesQueryDto,
  ): Promise<PaginatedNominationFileAffectationItem> {
    return this.sessions.listNominationFiles({
      user,
      sessionId,
      pagination,
      filters: {
        priorities: query.priorities ?? [],
        reporterIds: query.reporterIds ?? [],
      },
      sort: {
        field: query.sortField,
        direction: query.sortDirection ?? 'asc',
      },
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:sessionId/files/reporters/versions/last')
  @ZodResponse({ type: FoundAffectationVersion, status: HttpStatus.OK })
  detailNominationSessionAffectationsVersion(
    @Param('sessionId') sessionId: string,
  ): Promise<FoundAffectationVersion> {
    return this.sessions.detailNominationSessionAffectationsVersion({
      sessionId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/:sessionId/files/reporters/versions')
  @HttpCode(HttpStatus.NO_CONTENT)
  publishNominationSessionAffectationsVersion(
    @Param('sessionId') sessionId: string,
    @AuthedUserId() userId: string,
  ): Promise<void> {
    return this.sessions.publishNominationSessionAffectationsVersion({
      sessionId,
      userId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/:sessionId/auto-affectation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async autoAffectation(
    @Param('sessionId') sessionId: string,
    @Body() body: AutoAffectationDto,
  ): Promise<void> {
    await this.sessions.autoAffectation({
      sessionId,
      nominationFileIds: body.nominationFileIds,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Patch('/:sessionId/files/:nominationFileId/comment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateNominationFileComment(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: UpdateCommentDto,
  ): Promise<void> {
    await this.sessions.updateNominationFileComment({
      sessionId,
      nominationFileId,
      comment: body.comment,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:sessionId/files/:nominationFileId/comment-access')
  @ZodResponse({ type: ListCommentAccessDto, status: HttpStatus.OK })
  getCommentAccess(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<ListCommentAccessDto> {
    return this.sessions.getCommentAccess({
      sessionId,
      nominationFileId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/:sessionId/files/:nominationFileId/comment-access')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateCommentAccess(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: UpdateCommentAccessDto,
  ): Promise<void> {
    await this.sessions.updateCommentAccess({
      sessionId,
      nominationFileId,
      userIds: body.userIds,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/:sessionId/files/:nominationFileId/outcome')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async defineNominationFileOutcome(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: DefineNominationFileOutcomeDto,
  ): Promise<void> {
    await this.sessions.defineNominationFileOutcome({
      sessionId,
      nominationFileId,
      comment: body.comment,
      outcome: body.outcome,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/:sessionId/attachments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    schema: UploadSessionAttachmentDto,
    destination: ({ request, id, mimetype }) =>
      `/sessions/${request.params.sessionId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  async uploadSessionAttachment(
    @Param('sessionId') sessionId: string,
    @Body() { file }: Multipart<typeof UploadSessionAttachmentDto>,
  ) {
    await this.sessions.addNominationSessionAttachment({
      sessionId,
      file,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Delete('/:sessionId/attachments/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSessionAttachment(
    @Param('sessionId') sessionId: string,
    @Param('fileId') fileId: string,
  ) {
    await this.sessions.removeNominationSessionAttachment({
      sessionId,
      fileId,
    });
  }

  @HasRole()
  @Get('/:sessionId/attachments')
  @ZodResponse({
    type: ListedNominationSessionAttachmentDto,
    status: HttpStatus.OK,
  })
  async listNominationSessionAttachments(
    @Param('sessionId') sessionId: string,
  ): Promise<ListedNominationSessionAttachmentDto> {
    return this.sessions.listAttachments({ sessionId });
  }

  /** @warning this is a mutation */
  @HasRole()
  @Get('/:sessionId/attachments/:fileId')
  @ZodResponse({
    type: DetailedNominationSessionAttachmentDto,
    status: HttpStatus.OK,
  })
  async createNominationSessionAttachmentUrl(
    @Param('sessionId') sessionId: string,
    @Param('fileId') fileId: string,
  ): Promise<DetailedNominationSessionAttachmentDto> {
    return this.sessions.detailAttachment({ sessionId, fileId });
  }

  @HasRole()
  @Get('/:sessionId')
  @ZodResponse({ type: DetailedNominationSessionDto, status: HttpStatus.OK })
  async detailsNominationSession(
    @Param('sessionId') sessionId: string,
  ): Promise<DetailedNominationSessionDto> {
    return this.sessions.details({ sessionId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/:sessionId')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateNominationSession(
    @Param('sessionId') sessionId: string,
    @Body() data: UpdateNominationSessionDto,
  ): Promise<void> {
    return this.sessions.update({
      sessionId,
      data: {
        ...data,

        date: DateOnly.fromString(data.date, 'yyyy-MM-dd'),
        observationsClosingDate: DateOnly.fromString(
          data.observationsClosingDate,
          'yyyy-MM-dd',
        ),
        dueDate: data.dueDate
          ? DateOnly.fromString(data.dueDate, 'yyyy-MM-dd')
          : null,
        positionStartDate: data.positionStartDate
          ? DateOnly.fromString(data.positionStartDate, 'yyyy-MM-dd')
          : null,
      },
    });
  }
}
