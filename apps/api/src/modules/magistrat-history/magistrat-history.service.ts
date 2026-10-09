import { Injectable } from '@nestjs/common';

import { Pagination } from 'src/modules/framework/pagination';
import type { RoleEnum } from 'src/modules/shared/role.enum';

import {
  ListedMagistratNominationFilesDto,
  ListMagistratNominationFilesQuery,
} from './infrastructure/queries/list-magistrat-nomination-files.query';
import {
  ListedMagistratObservationsDto,
  ListMagistratObservationsQuery,
} from './infrastructure/queries/list-magistrat-observations.query';

@Injectable()
export class MagistratHistoryService {
  constructor(
    private readonly listMagistratNominationFilesQuery: ListMagistratNominationFilesQuery,
    private readonly listMagistratObservationsQuery: ListMagistratObservationsQuery,
  ) {}

  listNominationFiles(query: {
    magistratId: string;
    pagination: Pagination;
    role: RoleEnum;
  }): Promise<ListedMagistratNominationFilesDto> {
    return this.listMagistratNominationFilesQuery.handle(query);
  }

  listObservations(query: {
    magistratId: string;
    pagination: Pagination;
    role: RoleEnum;
  }): Promise<ListedMagistratObservationsDto> {
    return this.listMagistratObservationsQuery.handle(query);
  }
}
