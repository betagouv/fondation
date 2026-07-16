import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { TypeDeSaisine } from 'shared-models';

import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { HasRole } from 'src/modules/simple-auth';

import { ListArchivedNominationSessionsQueryDto } from './archived-sessions.dto';
import { ArchivedSessionsService } from './archived-sessions.service';
import { ListedArchivedNominationSessionsDto } from './infrastructure/queries/list-archived-nomination-sessions.query';

@ApiTags('Archived Sessions')
@Controller('/api/archived-sessions/v1')
export class ArchivedSessionsController {
  constructor(private readonly archivedSessions: ArchivedSessionsService) {}

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ type: ListedArchivedNominationSessionsDto, status: HttpStatus.OK })
  listArchivedSessions(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListArchivedNominationSessionsQueryDto,
  ): Promise<ListedArchivedNominationSessionsDto> {
    return this.archivedSessions.list({
      pagination,
      search: query.search || null,
      formations: query.formations,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    });
  }
}
