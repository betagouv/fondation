import { Controller, Get, HttpStatus, Param, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { HasRole } from '../simple-auth';

import { SearchMagistratsQueryDto } from './infrastructure/dtos/magistrat.dto';
import { DetailedMagistratDto } from './infrastructure/queries/detail-magistrat.query';
import { ListedMagistratNominationFilesDto } from './infrastructure/queries/list-magistrat-nomination-files.query';
import { ListedMagistratObservationsDto } from './infrastructure/queries/list-magistrat-observations.query';
import { SearchMagistratsResponseDto } from './infrastructure/queries/search-magistrats.query';
import { MagistratService } from './magistrat.service';

@ApiTags('Magistrats')
@Controller('/api/magistrats/v1')
export class MagistratController {
  constructor(private readonly magistrats: MagistratService) {}

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({
    type: SearchMagistratsResponseDto,
    status: HttpStatus.OK,
  })
  async searchMagistrats(
    @Query() query: SearchMagistratsQueryDto,
    @QueryPagination({ defaultLimit: 10 }) pagination: Pagination,
  ): Promise<SearchMagistratsResponseDto> {
    return this.magistrats.searchMagistrats({
      pagination,
      search: query.search,
      ignoreIds: query.ignore,
    });
  }

  @Get('/:magistratId')
  @HasRole()
  @ZodResponse({
    type: DetailedMagistratDto,
    status: HttpStatus.OK,
  })
  detailMagistrat(@Param('magistratId') magistratId: string): Promise<DetailedMagistratDto> {
    return this.magistrats.detailMagistrat({ magistratId });
  }

  @Get('/:magistratId/nomination-files')
  @HasRole()
  @ApiPaginated()
  @ZodResponse({
    type: ListedMagistratNominationFilesDto,
    status: HttpStatus.OK,
  })
  listMagistratNominationFiles(
    @Param('magistratId') magistratId: string,
    @QueryPagination({ defaultLimit: 10 }) pagination: Pagination,
  ): Promise<ListedMagistratNominationFilesDto> {
    return this.magistrats.listNominationFiles({ magistratId, pagination });
  }

  @Get('/:magistratId/observations')
  @HasRole()
  @ApiPaginated()
  @ZodResponse({
    type: ListedMagistratObservationsDto,
    status: HttpStatus.OK,
  })
  listMagistratObservations(
    @Param('magistratId') magistratId: string,
    @QueryPagination({ defaultLimit: 10 }) pagination: Pagination,
  ): Promise<ListedMagistratObservationsDto> {
    return this.magistrats.listObservations({ magistratId, pagination });
  }
}
