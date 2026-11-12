import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, type Pagination, QueryPagination } from '../framework/pagination';
import { HasRole } from '../simple-auth';

import {
  ListedFollowedUpObservationsDto,
  ListFollowedUpObservationsQueryDto,
} from './infrastructure/dtos/followed-up-observation.dto';
import { ObservationService } from './observation.service';

@ApiTags('Observations')
@Controller('/api/observations/v1')
export class FollowedUpObservationsController {
  constructor(private readonly observations: ObservationService) {}

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedFollowedUpObservationsDto })
  listFollowedUpObservations(
    @QueryPagination() pagination: Pagination,
    @Query(ZodValidationPipe) query: ListFollowedUpObservationsQueryDto,
  ): Promise<ListedFollowedUpObservationsDto> {
    return this.observations.listFollowedUpObservations({
      filters: {
        followUps: query.followUps,
        search: query.search ?? null,
        sessionStatuses: query.sessionStatuses,
        trackingStatuses: query.trackingStatuses,
      },
      pagination,
      sortBy: query.sortBy ?? null,
      sortDesc: query.sortDesc,
    });
  }
}
