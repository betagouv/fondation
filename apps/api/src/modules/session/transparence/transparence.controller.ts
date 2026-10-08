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
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FILE_EXTENSIONS, FILE_MIME_TYPES, Multipart, UseMultipartBody } from 'src/modules/framework/files';
import { ApiOkDiscriminatedByType } from 'src/modules/framework/openapi';
import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, AuthedUserId, HasRole } from 'src/modules/simple-auth';
import { DateOnly } from 'src/utils/date-only';

import { LodamTransparenceFile } from './domain/transparence-file';
import { AutoAffectationDto } from './infrastructure/dtos/auto-affectation.dto';
import {
  AffectReportersDto,
  ListNominationFilesQueryDto,
  UpdateAuditionDateDto,
  UpdateAuditionRequestDto,
  UpdateCommentDto,
  UpdateMissingEvaluationCommentDto,
  UpdateMissingEvaluationDto,
} from './infrastructure/dtos/nomination-file.dto';
import {
  CountedSessionAuditionsDto,
  ListedSessionAuditionsDto,
  ListSessionAuditionsQueryDto,
} from './infrastructure/dtos/session-audition.dto';
import {
  CountUnaffectedFilesQueryDto,
  CreatedNominationSessionDto,
  DefineNominationFileOutcomeDto,
  DefineNominationFilesOutcomeDto,
  ImportNominationSessionFromLodamXlsxDto,
  ListGdsNominationSessionsQueryDto,
  UpdateNominationSessionDto,
  UpdateNominationSessionFilesObserversDto,
  UploadNominationFileAttachmentsDto,
  UploadSessionAttachmentsDto,
  WriteSessionCommentDto,
} from './infrastructure/dtos/transparence-session.dto';
import {
  FoundAffectationVersion,
  NoneAffectationVersion,
  SomeAffectationVersion,
} from './infrastructure/finders/affectation-version.finder';
import { LodamXlsxPipe } from './infrastructure/lodam-xlsx.pipe';
import { NominationFilesStatusCountDto } from './infrastructure/queries/count-nomination-files-by-status.query';
import { CountedUnaffectedFilesDto } from './infrastructure/queries/count-unaffected-files.query';
import { CountUsersNewSessionsDto } from './infrastructure/queries/count-users-new-sessions.query';
import { DetailedAffectationHistoryDto } from './infrastructure/queries/detail-affectation-history.query';
import { DetailedAuditionsPublicationDto } from './infrastructure/queries/detail-auditions-publication.query';
import { DetailedNominationFileAttachmentDto } from './infrastructure/queries/detail-nomination-file-attachment.query';
import { DetailedNominationSessionAttachmentDto } from './infrastructure/queries/detail-nomination-session-attachment.query';
import { DetailedNominationSessionDto } from './infrastructure/queries/detail-nomination-session.query';
import { DetailedSessionCommentDto } from './infrastructure/queries/detail-session-comment.query';
import { LolfiMagistratUrlDto } from './infrastructure/queries/get-lolfi-magistrat-url.query';
import { ListedCurrentlyAffectedReportersDto } from './infrastructure/queries/list-currently-affected-reporters.query';
import { ListedNominationFileAttachmentDto } from './infrastructure/queries/list-nomination-file-attachments.query';
import {
  DetailedNominationFileDto,
  PaginatedNominationFiles,
} from './infrastructure/queries/list-nomination-files.query';
import { ListedNominationSessionAttachmentDto } from './infrastructure/queries/list-nomination-session-attachments.query';
import { ListedNominationSessionsDto } from './infrastructure/queries/list-nomination-sessions.query';
import { TransparenceExceptionFilter } from './infrastructure/transparence.filter';
import { TransparenceService } from './infrastructure/transparence.service';

@ApiTags('Sessions')
@UseInterceptors(TransparenceExceptionFilter)
@Controller('/api/sessions/v2')
export class SessionController {
  constructor(private readonly sessions: TransparenceService) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/garde-des-sceaux')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedNominationSessionsDto })
  listSessionsOfTypeGardeDesSceaux(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListGdsNominationSessionsQueryDto,
  ): Promise<ListedNominationSessionsDto> {
    return this.sessions.listNominationSessions({
      formations: query.formations,
      pagination,
      search: query.search || null,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      typeDeSaisine: 'TRANSPARENCE_GDS',
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/new/count')
  @ZodResponse({ status: HttpStatus.OK, type: CountUsersNewSessionsDto })
  countUsersNewSessions(): Promise<CountUsersNewSessionsDto> {
    return this.sessions.countUsersNewSessions();
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/:sessionId/validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @AuthedUserId() userId: string,
  ): Promise<void> {
    await this.sessions.validateSession({ sessionId, userId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/:sessionId/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @AuthedUserId() userId: string,
  ): Promise<void> {
    return this.sessions.archiveSession({ sessionId, userId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/:sessionId/comment')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedSessionCommentDto })
  detailSessionComment(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<DetailedSessionCommentDto> {
    return this.sessions.detailComment({ sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/comment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  writeSessionComment(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: WriteSessionCommentDto,
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
  ): Promise<void> {
    return this.sessions.writeComment({
      comment: body.comment,
      impersonatorId: user.impersonation?.impersonatorId ?? null,
      sessionId,
      userId: user.id,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/lodam')
  @UseMultipartBody({
    deleteOnFail: false,
    destination: ({ id, mimetype }) => `lodam/${new Date().toISOString()}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    overrideFiles: false,
    schema: ImportNominationSessionFromLodamXlsxDto,
  })
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedNominationSessionDto,
  })
  async createSessionFromLodam(
    @AuthedUser() user: { id: string },
    @Body(LodamXlsxPipe)
    files: LodamTransparenceFile[],
    @Body()
    { form }: ImportNominationSessionFromLodamXlsxDto,
  ): Promise<CreatedNominationSessionDto> {
    return this.sessions.createNominationSessionFromLodam({
      ...form,
      dueDate: form.dueDate ?? null,
      files,
      positionStartDate: form.positionStartDate ?? null,
      userId: user.id,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/lodam/:sessionId/observers')
  @UseMultipartBody({
    deleteOnFail: false,
    destination: ({ id, mimetype }) => `lodam/${new Date().toISOString()}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    overrideFiles: false,
    schema: UpdateNominationSessionFilesObserversDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateSessionObservers(
    @Param('sessionId') sessionId: string,
    @Body(LodamXlsxPipe)
    files: LodamTransparenceFile[],
  ) {
    await this.sessions.updateSessionNominationFileObservers({
      files,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/:sessionId/files/reporters')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async affectReporters(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: AffectReportersDto,
  ): Promise<void> {
    await this.sessions.affectReportersAndPriorities({
      affectations: body.items,
      authorId: userId,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  @Get('/:sessionId/files.xlsx')
  listNominationFilesAsExcel(@Param('sessionId', ParseUUIDPipe) sessionId: string): Promise<StreamableFile> {
    return this.sessions.listNominationFilesAsExcel({ sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  @Get('/:sessionId/auditions.xlsx')
  listSessionAuditionsAsExcel(
    @AuthedUser() user: { role: RoleEnum },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<StreamableFile> {
    return this.sessions.listSessionAuditionsAsExcel({ role: user.role, sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/:sessionId/auditions/publications')
  @HttpCode(HttpStatus.NO_CONTENT)
  async publishSessionAuditions(
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<void> {
    await this.sessions.publishAuditions({
      impersonatorId: user.impersonation?.impersonatorId ?? null,
      sessionId,
      userId: user.id,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/:sessionId/auditions/publications/last')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAuditionsPublicationDto })
  detailLastSessionAuditionsPublication(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<DetailedAuditionsPublicationDto> {
    return this.sessions.detailAuditionsPublication({ sessionId });
  }

  @HasRole()
  @Get('/:sessionId/auditions/counts')
  @ZodResponse({ status: HttpStatus.OK, type: CountedSessionAuditionsDto })
  countSessionAuditions(
    @AuthedUser() user: { role: RoleEnum },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<CountedSessionAuditionsDto> {
    return this.sessions.countSessionAuditions({ role: user.role, sessionId });
  }

  @HasRole()
  @Get('/:sessionId/auditions')
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedSessionAuditionsDto })
  listSessionAuditions(
    @AuthedUser() user: { role: RoleEnum },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @QueryPagination() pagination: Pagination,
    @Query(ZodValidationPipe) query: ListSessionAuditionsQueryDto,
  ): Promise<ListedSessionAuditionsDto> {
    return this.sessions.listSessionAuditions({
      filters: { reporterIds: query.reporterIds ?? [], search: query.search ?? null },
      pagination,
      role: user.role,
      sessionId,
      sortBy: query.sortBy ?? null,
      sortDesc: query.sortDesc,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  @Get('/:sessionId/files/missing-evaluations.xlsx')
  listMissingEvaluationsAsExcel(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<StreamableFile> {
    return this.sessions.listMissingEvaluationsAsExcel({ sessionId });
  }

  @HasRole()
  @Get('/:sessionId/files')
  @ApiPaginated()
  @ZodResponse({
    status: HttpStatus.OK,
    type: PaginatedNominationFiles,
  })
  listNominationFiles(
    @Param('sessionId') sessionId: string,
    @AuthedUser() user: { id: string; role: RoleEnum },
    @QueryPagination() pagination: Pagination,
    @Query(ZodValidationPipe) query: ListNominationFilesQueryDto,
  ) {
    return this.sessions.listNominationFiles({
      filters: {
        missingEvaluation: query.missingEvaluation,
        nominationFileIds: query.nominationFileIds,
        outcomes: query.outcomes,
        priorities: query.priorities ?? [],
        reporterIds: query.reporterIds ?? [],
        search: query.search || null,
      },
      pagination,
      sessionId,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      user,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/:sessionId/files/reporters/versions/last')
  @ApiOkDiscriminatedByType(SomeAffectationVersion, NoneAffectationVersion)
  detailNominationSessionAffectationsVersion(
    @Param('sessionId') sessionId: string,
  ): Promise<FoundAffectationVersion> {
    return this.sessions.detailNominationSessionAffectationsVersion({
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/:sessionId/files/reporters/versions/history')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedAffectationHistoryDto })
  detailAffectationHistory(@Param('sessionId') sessionId: string): Promise<DetailedAffectationHistoryDto> {
    return this.sessions.detailAffectationHistory({ sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/:sessionId/files/reporters/versions/last/unaffected-count')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: CountedUnaffectedFilesDto })
  countUnaffectedNominationFiles(
    @Param('sessionId') sessionId: string,
    @Query() { nominationFileIds }: CountUnaffectedFilesQueryDto,
  ): Promise<CountedUnaffectedFilesDto> {
    return this.sessions.countUnaffectedFiles({
      nominationFileIds,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/:sessionId/files/status-counts')
  @ZodResponse({ status: HttpStatus.OK, type: NominationFilesStatusCountDto })
  countNominationFilesByStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<NominationFilesStatusCountDto> {
    return this.sessions.countNominationFilesByStatus({ sessionId });
  }

  @HasRole()
  @Get('/:sessionId/files/reporters/versions/last/members')
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedCurrentlyAffectedReportersDto,
  })
  listCurrentlyAffectedReporters(
    @AuthedUser() user: { role: RoleEnum },
    @Param('sessionId') sessionId: string,
  ): Promise<ListedCurrentlyAffectedReportersDto> {
    return this.sessions.listCurrentlyAffectedReporters({ role: user.role, sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
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

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/:sessionId/auto-affectation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async autoAffectation(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: AutoAffectationDto,
  ): Promise<void> {
    await this.sessions.autoAffectation({
      authorId: userId,
      excludedMemberIds: body.excludedMemberIds,
      nominationFileIds: body.nominationFileIds,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/:sessionId/files/:nominationFileId/comment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateNominationFileComment(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: UpdateCommentDto,
  ): Promise<void> {
    await this.sessions.updateNominationFileComment({
      comment: body.comment,
      nominationFileId,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/files/:nominationFileId/missing-evaluation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateNominationFileMissingEvaluation(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: UpdateMissingEvaluationDto,
  ): Promise<void> {
    await this.sessions.updateNominationFileMissingEvaluation({
      missingEvaluation: body.missingEvaluation,
      nominationFileId,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/:sessionId/files/:nominationFileId/missing-evaluation/comment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateNominationFileMissingEvaluationComment(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: UpdateMissingEvaluationCommentDto,
  ): Promise<void> {
    await this.sessions.updateNominationFileMissingEvaluationComment({
      comment: body.comment,
      nominationFileId,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/files/:nominationFileId/audition/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateNominationFileAuditionRequest(
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Body() body: UpdateAuditionRequestDto,
  ): Promise<void> {
    await this.sessions.updateNominationFileAuditionRequest({
      impersonatorId: user.impersonation?.impersonatorId ?? null,
      nominationFileId,
      requested: body.requested,
      sessionId,
      userId: user.id,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/files/:nominationFileId/audition/schedule')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateNominationFileAuditionDate(
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: UpdateAuditionDateDto,
  ): Promise<void> {
    const auditionDateTime =
      !body.auditionDate || !body.auditionTime
        ? null
        : { date: DateOnly.fromJson(body.auditionDate), time: body.auditionTime };

    await this.sessions.updateNominationFileAuditionDate({
      auditionDateTime,
      impersonatorId: user.impersonation?.impersonatorId ?? null,
      nominationFileId,
      sessionId,
      userId: user.id,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/files/outcome')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async defineNominationFilesOutcome(
    @Param('sessionId') sessionId: string,
    @Body() body: DefineNominationFilesOutcomeDto,
  ): Promise<void> {
    await this.sessions.defineNominationFilesOutcome({
      items: body.items,
      outcome: body.outcome,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/files/:nominationFileId/outcome')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async defineNominationFileOutcome(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: DefineNominationFileOutcomeDto,
  ): Promise<void> {
    await this.sessions.defineNominationFileOutcome({
      comment: body.comment,
      nominationFileId,
      outcome: body.outcome,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/:sessionId/file/:nominationFileId/alert')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hideNominationFileAlert(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<void> {
    await this.sessions.hideAlert({ nominationFileId, sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/multiattachments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    schema: UploadSessionAttachmentsDto,
  })
  async uploadSessionAttachments(
    @Param('sessionId') sessionId: string,
    @Body() { files }: Multipart<typeof UploadSessionAttachmentsDto>,
  ) {
    await this.sessions.addNominationSessionAttachments({
      files,
      sessionId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/:sessionId/attachments/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSessionAttachment(@Param('sessionId') sessionId: string, @Param('fileId') fileId: string) {
    await this.sessions.removeNominationSessionAttachment({
      fileId,
      sessionId,
    });
  }

  @HasRole()
  @Get('/:sessionId/attachments')
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedNominationSessionAttachmentDto,
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
    status: HttpStatus.OK,
    type: DetailedNominationSessionAttachmentDto,
  })
  async createNominationSessionAttachmentUrl(
    @Param('sessionId') sessionId: string,
    @Param('fileId') fileId: string,
  ): Promise<DetailedNominationSessionAttachmentDto> {
    return this.sessions.detailAttachment({ fileId, sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId/files/:nominationFileId/attachments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/files/${request.params.nominationFileId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    schema: UploadNominationFileAttachmentsDto,
  })
  async uploadNominationFileAttachments(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() { files, form }: Multipart<typeof UploadNominationFileAttachmentsDto>,
  ) {
    await this.sessions.addNominationFileAttachments({
      files,
      nominationFileId,
      sessionId,
      type: form.type,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/:sessionId/files/:nominationFileId/attachments/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeNominationFileAttachment(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Param('fileId') fileId: string,
  ) {
    await this.sessions.removeNominationFileAttachment({ fileId, nominationFileId, sessionId });
  }

  @HasRole()
  @Get('/:sessionId/files/:nominationFileId/attachments')
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedNominationFileAttachmentDto,
  })
  async listNominationFileAttachments(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<ListedNominationFileAttachmentDto> {
    return this.sessions.listNominationFileAttachments({ nominationFileId, sessionId });
  }

  /** @warning this is a mutation */
  @HasRole()
  @Get('/:sessionId/files/:nominationFileId/attachments/:fileId')
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedNominationFileAttachmentDto,
  })
  async createNominationFileAttachmentUrl(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Param('fileId') fileId: string,
  ): Promise<DetailedNominationFileAttachmentDto> {
    return this.sessions.detailNominationFileAttachment({ fileId, nominationFileId, sessionId });
  }

  @HasRole()
  @Get('/:sessionId/files/:nominationFileId')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedNominationFileDto })
  detailNominationFile(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @AuthedUser() user: { id: string; role: RoleEnum },
  ): Promise<DetailedNominationFileDto> {
    return this.sessions.detailNominationFile({ nominationFileId, sessionId, user });
  }

  @HasRole()
  @Get('/:sessionId')
  @ZodResponse({ status: HttpStatus.OK, type: DetailedNominationSessionDto })
  async detailsNominationSession(
    @Param('sessionId') sessionId: string,
    @AuthedUser() user: { role: RoleEnum },
  ): Promise<DetailedNominationSessionDto> {
    return this.sessions.details({ formation: roleToFormation(user.role), sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:sessionId')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateNominationSession(
    @Param('sessionId') sessionId: string,
    @Body() data: UpdateNominationSessionDto,
  ): Promise<void> {
    return this.sessions.update({
      data: {
        ...data,

        date: DateOnly.fromString(data.date, 'yyyy-MM-dd'),
        dueDate: data.dueDate ? DateOnly.fromString(data.dueDate, 'yyyy-MM-dd') : null,
        observationsClosingDate: DateOnly.fromString(data.observationsClosingDate, 'yyyy-MM-dd'),
        positionStartDate: data.positionStartDate
          ? DateOnly.fromString(data.positionStartDate, 'yyyy-MM-dd')
          : null,
      },
      sessionId,
    });
  }

  @Get('/:sessionId/files/:nominationFileId/lolfi-url')
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: LolfiMagistratUrlDto })
  async getLolfiMagistratUrl(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
  ): Promise<LolfiMagistratUrlDto> {
    return this.sessions.getLolfiMagistratUrl({ nominationFileId, sessionId });
  }

  @Delete('/:sessionId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNominationSession(
    @Param('sessionId', ParseUUIDPipe) id: string,
    @AuthedUser() { id: userId }: { id: string },
  ): Promise<void> {
    return this.sessions.deleteSession({ id, userId });
  }
}
