import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { ListedMagistratNominationFilesDto } from './infrastructure/queries/list-magistrat-nomination-files.query';
import { ListedMagistratObservationsDto } from './infrastructure/queries/list-magistrat-observations.query';
import { MagistratHistoryService } from './magistrat-history.service';

@ApiTags('Magistrats')
@Controller('/api/magistrats/v1')
export class MagistratHistoryController {
  constructor(private readonly history: MagistratHistoryService) {}

  @Get('/:magistratId/nomination-files')
  @HasRole()
  @ApiPaginated()
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedMagistratNominationFilesDto,
  })
  listMagistratNominationFiles(
    @AuthedUser() user: { role: RoleEnum },
    @Param('magistratId') magistratId: string,
    @QueryPagination({ defaultLimit: 5 }) pagination: Pagination,
  ): Promise<ListedMagistratNominationFilesDto> {
    return this.history.listNominationFiles({ magistratId, pagination, role: user.role });
  }

  @Get('/:magistratId/observations')
  @HasRole()
  @ApiPaginated()
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedMagistratObservationsDto,
  })
  listMagistratObservations(
    @AuthedUser() user: { role: RoleEnum },
    @Param('magistratId') magistratId: string,
    @QueryPagination({ defaultLimit: 5 }) pagination: Pagination,
  ): Promise<ListedMagistratObservationsDto> {
    return this.history.listObservations({ magistratId, pagination, role: user.role });
  }
}
