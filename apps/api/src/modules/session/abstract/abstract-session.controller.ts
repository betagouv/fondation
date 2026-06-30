import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { HasRole } from 'src/modules/simple-auth';

import { ListGdsNominationSessionsQueryDto } from './abstract-session.dto';
import { AbstractSessionService } from './abstract-session.service';
import { CountUsersNewSessionsDto } from './infrastructure/queries/count-non-validated-sessions.query';
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
  @Get('/new/count')
  @ZodResponse({ type: CountUsersNewSessionsDto, status: HttpStatus.OK })
  countUsersNewSessions(): Promise<CountUsersNewSessionsDto> {
    return this.sessions.countNonValidatedSessions();
  }
}
