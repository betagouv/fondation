import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HasRole } from '../simple-auth';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';
import { SearchMagistratsResponseDto } from './infrastructure/queries/search-magistrats.query';
import { SearchMagistratsQueryDto } from './infrastructure/dtos/observation.dto';
import { Role } from 'shared-models';
import { MagistratService } from './infrastructure/magistrat.service';
import {
  ApiPaginated,
  Pagination,
  QueryPagination,
} from '../framework/pagination';

@ApiTags('Magistrats')
@Controller('/api/magistrats/v1')
export class MagistratController {
  constructor(private readonly magistrats: MagistratService) {}

  @Get('/magistrats/search')
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
}
