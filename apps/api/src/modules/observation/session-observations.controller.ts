import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, type Pagination, QueryPagination } from '../framework/pagination';
import type { RoleEnum } from '../shared/role.enum';
import { AuthedUser, HasRole } from '../simple-auth';

import { ListObservationsAttachmentsQueryDto } from './infrastructure/dtos/observation.dto';
import {
  CountedSessionObservationsDto,
  ListedSessionObservationsDto,
  ListSessionObservationsQueryDto,
} from './infrastructure/dtos/session-observation.dto';
import { ListedObservationsAttachmentsDto } from './infrastructure/queries/list-observations-attachments.query';
import { ObservationService } from './observation.service';

@ApiTags('Observations')
@Controller('/api/sessions/v2/:sessionId/observations')
export class SessionObservationsController {
  constructor(private readonly observations: ObservationService) {}

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedSessionObservationsDto })
  listSessionObservations(
    @AuthedUser() user: { role: RoleEnum },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @QueryPagination() pagination: Pagination,
    @Query(ZodValidationPipe) query: ListSessionObservationsQueryDto,
  ): Promise<ListedSessionObservationsDto> {
    return this.observations.listSessionObservations({
      filters: { followUps: query.followUps, search: query.search ?? null },
      pagination,
      role: user.role,
      sessionId,
      sortBy: query.sortBy ?? null,
      sortDesc: query.sortDesc,
    });
  }

  @Get('/count')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({ status: HttpStatus.OK, type: CountedSessionObservationsDto })
  countSessionObservations(
    @AuthedUser() user: { role: RoleEnum },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<CountedSessionObservationsDto> {
    return this.observations.countSessionObservations({ role: user.role, sessionId });
  }

  @Get('/attachments')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedObservationsAttachmentsDto,
  })
  listObservationsAttachments(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query() query: ListObservationsAttachmentsQueryDto,
  ): Promise<ListedObservationsAttachmentsDto> {
    return this.observations.listObservationsAttachments({
      sessionId,
      magistratId: query.magistratId,
      excludeObservationId: query.excludeObservationId,
    });
  }
}
