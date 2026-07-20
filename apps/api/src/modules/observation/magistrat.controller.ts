import { Controller, Get, HttpStatus, Param, Query, UsePipes } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { PrismaService } from '../framework/database';
import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { HasRole } from '../simple-auth';
import { findMagistratExternalIdByFullName } from 'src/generated/prisma/sql';
import { unaccent } from 'src/utils/unaccent';

import { SearchMagistratsQueryDto } from './infrastructure/dtos/observation.dto';
import { MagistratService } from './infrastructure/magistrat.service';
import { DetailedMagistratDto } from './infrastructure/queries/detail-magistrat.query';
import { SearchMagistratsResponseDto } from './infrastructure/queries/search-magistrats.query';

@ApiTags('Magistrats')
@Controller('/api/magistrats/v1')
export class MagistratController {
  constructor(
    private readonly magistrats: MagistratService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get('fullname')
  searchFullName(@Query('search') search: string) {
    return this.prisma.$queryRawTyped(findMagistratExternalIdByFullName(unaccent(search.toLowerCase())));
  }

  @Get('/:magistratId')
  @HasRole()
  @ApiParam({ name: 'magistratId', type: 'string', format: 'uuid' })
  @ZodResponse({
    type: DetailedMagistratDto,
    status: HttpStatus.OK,
  })
  detailMagistrat(@Param('magistratId') magistratId: string): Promise<DetailedMagistratDto> {
    return this.magistrats.detailMagistrat({ magistratId });
  }
}
