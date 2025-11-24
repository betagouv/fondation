import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { Role, TypeDeSaisine } from 'shared-models';
import {
  Paginated,
  Pagination,
  QueryPagination,
} from '../framework/pagination';
import { AuthedUserId, HasRole } from '../simple-auth';
import {
  AffectReportersDto,
  ListNominationFilesQueryDto,
} from './infrastructure/dtos/nomination-file.dto';
import { FoundAffectationVersion } from './infrastructure/finders/affectation-version.finder';
import { type DetailedSessionResponse } from './infrastructure/queries/detail-session.query';
import { NominationFileAffectationItem } from './infrastructure/queries/list-nomination-files.query';
import { type ListSessionOfTypeGardeDesSceauxResponse } from './infrastructure/queries/list-sessions-of-type-garde-des-sceaux.query';
import { SessionService } from './infrastructure/sessions.service';
import { SessionExceptionFilter } from './infrastructure/session.filter';

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

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:sessionId/files')
  @UsePipes(ZodValidationPipe)
  listNominationFiles(
    @Param('sessionId') sessionId: string,
    @QueryPagination() pagination: Pagination,
    @Query() query: ListNominationFilesQueryDto,
  ): Promise<Paginated<NominationFileAffectationItem>> {
    return this.sessions.listNominationFiles({
      sessionId,
      pagination,
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
}
