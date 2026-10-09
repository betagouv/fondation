import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { HasRole } from 'src/modules/simple-auth';

import { ListGdsNominationSessionsQueryDto } from './infrastructure/dtos/transparence-session.dto';
import { ListedArchivedNominationSessionsDto } from './infrastructure/queries/list-archived-nomination-sessions.query';
import { TransparenceService } from './infrastructure/transparence.service';

@ApiTags('Archived Sessions')
@Controller('/api/archived-sessions/v1')
export class ArchivedSessionsController {
  constructor(private readonly sessions: TransparenceService) {}

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ type: ListedArchivedNominationSessionsDto, status: HttpStatus.OK })
  listArchivedSessions(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListGdsNominationSessionsQueryDto,
  ): Promise<ListedArchivedNominationSessionsDto> {
    return this.sessions.listArchivedSessions({
      pagination,
      search: query.search || null,
      formations: query.formations,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      typeDeSaisine: 'TRANSPARENCE_GDS',
    });
  }
}
