import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Role, TypeDeSaisine } from 'shared-models';

import { AuthedUser, AuthedUserId, HasRole } from 'src/modules/simple-auth';

import { LodamNominationFile } from './domain/nomination-file';
import { LodamXlsxPipe } from './infrastructure/lodam-xlsx.pipe';
import { SessionExceptionFilter } from './infrastructure/session.filter';
import { SessionService } from './infrastructure/sessions.service';

import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { DateOnly } from 'src/utils/date-only';
import {
  FILE_EXTENSIONS,
  FILE_MIME_TYPES,
  UseMultipartBody,
  type Multipart,
} from '../framework/files';
import {
  ApiPaginated,
  Pagination,
  QueryPagination,
} from '../framework/pagination';
import { AutoAffectationDto } from './infrastructure/dtos/auto-affectation.dto';
import {
  AffectReportersDto,
  ListNominationFilesQueryDto,
  UpdateCommentAccessDto,
  UpdateCommentDto,
} from './infrastructure/dtos/nomination-file.dto';
import {
  CountUnaffectedFilesQueryDto,
  CreatedNominationSessionDto,
  DefineNominationFileOutcomeDto,
  ImportNominationSessionFromLodamXlsxDto,
  ListCommentAccessDto,
  ListGdsNominationSessionsQueryDto,
  UpdateNominationSessionDto,
  UpdateNominationSessionFilesObserversDto,
  UploadSessionAttachmentDto,
  UploadSessionAttachmentsDto,
} from './infrastructure/dtos/nomination-session.dto';
import {
  FoundAffectationVersion,
  NoneAffectationVersion,
  SomeAffectationVersion,
} from './infrastructure/finders/affectation-version.finder';
import { NominationFilesStatusCountDto } from './infrastructure/queries/count-nomination-files-by-status.query';
import { CountedUnaffectedFilesDto } from './infrastructure/queries/count-unaffected-files.query';
import { CountUsersNewSessionsDto } from './infrastructure/queries/count-users-new-sessions.query';
import { DetailedNominationSessionAttachmentDto } from './infrastructure/queries/detail-nomination-session-attachment.query';
import { DetailedNominationSessionDto } from './infrastructure/queries/detail-nomination-session.query';
import { LolfiMagistratUrlDto } from './infrastructure/queries/get-lolfi-magistrat-url.query';
import { ListedCurrentlyAffectedReportersDto } from './infrastructure/queries/list-currently-affected-reporters.query';
import { PaginatedNominationFiles } from './infrastructure/queries/list-nomination-files.query';
import { ListedNominationSessionAttachmentDto } from './infrastructure/queries/list-nomination-session-attachments.query';
import { ListedNominationSessionsDto } from './infrastructure/queries/list-nomination-sessions.query';

@ApiTags('Sessions')
@UseInterceptors(SessionExceptionFilter)
@Controller('/api/sessions/v2')
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/garde-des-sceaux')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ type: ListedNominationSessionsDto, status: HttpStatus.OK })
  listSessionsOfTypeGardeDesSceaux(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListGdsNominationSessionsQueryDto,
  ): Promise<ListedNominationSessionsDto> {
    return this.sessions.listNominationSessions({
      pagination,
      formations: query.formations,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/new/count')
  @ZodResponse({ type: CountUsersNewSessionsDto, status: HttpStatus.OK })
  countUsersNewSessions(): Promise<CountUsersNewSessionsDto> {
    return this.sessions.countUsersNewSessions();
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/:sessionId/validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @AuthedUserId() userId: string,
  ): Promise<void> {
    await this.sessions.validateSession({ sessionId, userId });
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
    @AuthedUser() user: { id: string },
    @Body(LodamXlsxPipe)
    files: LodamNominationFile[],
    @Body()
    { form }: ImportNominationSessionFromLodamXlsxDto,
  ): Promise<CreatedNominationSessionDto> {
    return this.sessions.createNominationSessionFromLodam({
      ...form,
      files,
      userId: user.id,
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
    files: LodamNominationFile[],
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

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  @Get('/:sessionId/files.xlsx')
  listNominationFilesAsExcel(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<StreamableFile> {
    return this.sessions.listNominationFilesAsExcel({ sessionId });
  }

  @HasRole()
  @Get('/:sessionId/files')
  @ApiPaginated()
  @ZodResponse({
    type: PaginatedNominationFiles,
    status: HttpStatus.OK,
  })
  listNominationFiles(
    @Param('sessionId') sessionId: string,
    @AuthedUser() user: { id: string; role: Role },
    @QueryPagination() pagination: Pagination,
    @Query(ZodValidationPipe) query: ListNominationFilesQueryDto,
  ) {
    return this.sessions.listNominationFiles({
      user,
      sessionId,
      pagination,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      filters: {
        priorities: query.priorities ?? [],
        reporterIds: query.reporterIds ?? [],
      },
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:sessionId/files/reporters/versions/last')
  @ApiExtraModels(SomeAffectationVersion, NoneAffectationVersion)
  @ApiOkResponse({
    schema: {
      type: 'object',
      discriminator: { propertyName: '@type' },
      oneOf: [
        { $ref: getSchemaPath(SomeAffectationVersion) },
        { $ref: getSchemaPath(NoneAffectationVersion) },
      ],
    },
  })
  detailNominationSessionAffectationsVersion(
    @Param('sessionId') sessionId: string,
  ): Promise<FoundAffectationVersion> {
    return this.sessions.detailNominationSessionAffectationsVersion({
      sessionId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:sessionId/files/reporters/versions/last/unaffected-count')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: CountedUnaffectedFilesDto, status: HttpStatus.OK })
  countUnaffectedNominationFiles(
    @Param('sessionId') sessionId: string,
    @Query() { nominationFileIds }: CountUnaffectedFilesQueryDto,
  ): Promise<CountedUnaffectedFilesDto> {
    return this.sessions.countUnaffectedFiles({
      sessionId,
      nominationFileIds,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:sessionId/files/status-counts')
  @ZodResponse({ type: NominationFilesStatusCountDto, status: HttpStatus.OK })
  countNominationFilesByStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<NominationFilesStatusCountDto> {
    return this.sessions.countNominationFilesByStatus({ sessionId });
  }

  @HasRole()
  @Get('/:sessionId/files/reporters/versions/last/members')
  @ZodResponse({
    type: ListedCurrentlyAffectedReportersDto,
    status: HttpStatus.OK,
  })
  listCurrentlyAffectedReporters(
    @Param('sessionId') sessionId: string,
  ): Promise<ListedCurrentlyAffectedReportersDto> {
    return this.sessions.listCurrentlyAffectedReporters({
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
      excludedMemberIds: body.excludedMemberIds,
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
  @ApiOperation({ deprecated: true })
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
  @Delete('/:sessionId/file/:nominationFileId/alert')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hideNominationFileAlert(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<void> {
    await this.sessions.hideAlert({ sessionId, nominationFileId });
  }

  /** @deprecated */
  @ApiOperation({
    deprecated: true,
    description: 'prefer uploadSessionAttachments',
  })
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/:sessionId/attachments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    schema: UploadSessionAttachmentDto,
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  async uploadSessionAttachment(
    @Param('sessionId') sessionId: string,
    @Body() { file }: Multipart<typeof UploadSessionAttachmentDto>,
  ) {
    await this.sessions.addNominationSessionAttachments({
      sessionId,
      files: [file],
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/:sessionId/multiattachments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    schema: UploadSessionAttachmentsDto,
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  async uploadSessionAttachments(
    @Param('sessionId') sessionId: string,
    @Body() { files }: Multipart<typeof UploadSessionAttachmentsDto>,
  ) {
    await this.sessions.addNominationSessionAttachments({
      sessionId,
      files,
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
    @AuthedUser() user: { id: string },
  ): Promise<DetailedNominationSessionDto> {
    return this.sessions.details({ sessionId, userId: user.id });
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

  @Get('/:sessionId/files/:nominationFileId/lolfi-url')
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: LolfiMagistratUrlDto })
  async getLolfiMagistratUrl(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
  ): Promise<LolfiMagistratUrlDto> {
    return this.sessions.getLolfiMagistratUrl({ sessionId, nominationFileId });
  }
}
