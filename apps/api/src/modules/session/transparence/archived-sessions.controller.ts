import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../../framework/pagination';
import type { RoleEnum } from '../../shared/role.enum';
import { AuthedUser, HasRole } from '../../simple-auth';

import { ListArchivedSessionsQueryDto } from './infrastructure/dtos/transparence-session.dto';
import { ListedArchivedNominationSessionsDto } from './infrastructure/queries/list-archived-nomination-sessions.query';
import { TransparenceService } from './infrastructure/transparence.service';

@ApiTags('Archived Sessions')
@Controller('/api/archived-sessions/v1')
export class ArchivedSessionsController {
  constructor(private readonly sessions: TransparenceService) {}

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL', 'MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ type: ListedArchivedNominationSessionsDto, status: HttpStatus.OK })
  listArchivedSessions(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListArchivedSessionsQueryDto,
    @AuthedUser() user: { role: RoleEnum },
  ): Promise<ListedArchivedNominationSessionsDto> {
    return this.sessions.listArchivedSessions({
      pagination,
      role: user.role,
      search: query.search || null,
      formations: query.formations,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      typeDeSaisine: 'TRANSPARENCE_GDS',
    });
  }
}
