import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';
import { Role } from 'shared-models';
import { findMagistratExternalIdByFullName } from 'src/generated/prisma/sql';
import { unaccent } from 'src/utils/unaccent';
import { PrismaService } from '../framework/database';
import {
  ApiPaginated,
  Pagination,
  QueryPagination,
} from '../framework/pagination';
import { HasRole } from '../simple-auth';
import { SearchMagistratsQueryDto } from './infrastructure/dtos/observation.dto';
import { MagistratService } from './infrastructure/magistrat.service';
import { SearchMagistratsResponseDto } from './infrastructure/queries/search-magistrats.query';

@ApiTags('Magistrats')
@Controller('/api/magistrats/v1')
export class MagistratController {
  constructor(
    private readonly magistrats: MagistratService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
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
      search: query.search,
      pagination,
    });
  }

  @Get('fullname')
  searchFullName(@Query('search') search: string) {
    return this.prisma.$queryRawTyped(
      findMagistratExternalIdByFullName(unaccent(search.toLowerCase())),
    );
  }
}
