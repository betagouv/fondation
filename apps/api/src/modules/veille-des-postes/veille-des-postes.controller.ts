import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { HasRole } from '../simple-auth';

import {
  ListCourtOfAppealFirstPresidentsDto,
  ListCourtOfCassationHoldersDto,
} from './infrastructure/dtos/veille-des-postes.dto';
import { ListedCourtOfAppealFirstPresidentsDto } from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import { ListedCourtOfCassationHoldersDto } from './infrastructure/queries/list-court-of-cassation-holders.query';
import { VeilleDesPostesService } from './veille-des-postes.service';

@ApiTags('Veille des postes')
@Controller('/api/veille-des-postes/v1')
export class VeilleDesPostesController {
  constructor(private readonly veilleDesPostes: VeilleDesPostesService) {}

  @Get('/cours-d-appel')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedCourtOfAppealFirstPresidentsDto })
  listCourtOfAppealFirstPresidents(
    @Query() query: ListCourtOfAppealFirstPresidentsDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedCourtOfAppealFirstPresidentsDto> {
    return this.veilleDesPostes.listCourtOfAppealFirstPresidents({
      pagination,
      search: query.search,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
    });
  }

  @Get('/cour-de-cassation')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedCourtOfCassationHoldersDto })
  listCourtOfCassationHolders(
    @Query() query: ListCourtOfCassationHoldersDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedCourtOfCassationHoldersDto> {
    return this.veilleDesPostes.listCourtOfCassationHolders({
      pagination,
      positions: query.positions ?? [],
      search: query.search,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
    });
  }
}
