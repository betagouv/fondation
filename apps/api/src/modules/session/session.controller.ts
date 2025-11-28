import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { Role, TypeDeSaisine } from 'shared-models';

import { AutoAffectationDto } from 'src/modules/session/infrastructure/dtos/auto-affectation.dto';
import { AuthedUserId, HasRole } from '../simple-auth';
import {
  AffectReportersDto,
  ListNominationFilesQueryDto,
  UpdateCommentDto,
} from './infrastructure/dtos/nomination-file.dto';
import { FoundAffectationVersion } from './infrastructure/finders/affectation-version.finder';
import { type DetailedSessionResponse } from './infrastructure/queries/detail-session.query';
import { NominationFileAffectationItem } from './infrastructure/queries/list-nomination-files.query';
import { type ListSessionOfTypeGardeDesSceauxResponse } from './infrastructure/queries/list-sessions-of-type-garde-des-sceaux.query';
import { SessionExceptionFilter } from './infrastructure/session.filter';
import { SessionService } from './infrastructure/sessions.service';

@UseInterceptors(SessionExceptionFilter)
@Controller('/api/sessions/v2')
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  @HasRole()
  @Get('/garde-des-sceaux')
  listSessionsOfTypeGardeDesSceaux(
    @AuthedUserId() userId: string,
  ): Promise<ListSessionOfTypeGardeDesSceauxResponse> {
    return this.sessions.listSessionsOfTypeGardeDesSceaux(userId);
  }

  @HasRole()
  @Get('/garde-des-sceaux/:sessionId')
  detailSession(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<DetailedSessionResponse> {
    return this.sessions.detailSession({
      userId,
      sessionId,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
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
  @UsePipes(ZodValidationPipe)
  listNominationFiles(
    @Param('sessionId') sessionId: string,
    @Query() query: ListNominationFilesQueryDto,
  ): Promise<{ items: NominationFileAffectationItem[] }> {
    return this.sessions.listNominationFiles({
      sessionId,
      filters: {
        priorities: query.priorities ?? [],
        reporterIds: query.reporterIds ?? [],
      },
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:sessionId/files/reporters/versions/last')
  detailNominationSessionAffectationsVersion(
    @Param('sessionId') sessionId: string,
  ): Promise<FoundAffectationVersion> {
    return this.sessions.detailNominationSessionAffectationsVersion({
      sessionId,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/:sessionId/files/reporters/versions')
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
}
