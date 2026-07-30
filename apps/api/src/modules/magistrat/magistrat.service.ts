import { Injectable } from '@nestjs/common';

import { Pagination } from 'src/modules/framework/pagination';

import { DetailedMagistratDto, DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import {
  ListedMagistratNominationFilesDto,
  ListMagistratNominationFilesQuery,
} from './infrastructure/queries/list-magistrat-nomination-files.query';
import {
  ListedMagistratObservationsDto,
  ListMagistratObservationsQuery,
} from './infrastructure/queries/list-magistrat-observations.query';
import {
  SearchMagistratsQuery,
  SearchMagistratsResponseDto,
} from './infrastructure/queries/search-magistrats.query';

@Injectable()
export class MagistratService {
  constructor(
    private readonly detailMagistratQuery: DetailMagistratQuery,
    private readonly listMagistratNominationFilesQuery: ListMagistratNominationFilesQuery,
    private readonly listMagistratObservationsQuery: ListMagistratObservationsQuery,
    private readonly searchMagistratsQuery: SearchMagistratsQuery,
  ) {}

  detailMagistrat(query: { magistratId: string }): Promise<DetailedMagistratDto> {
    return this.detailMagistratQuery.handle(query);
  }

  listNominationFiles(query: {
    magistratId: string;
    pagination: Pagination;
  }): Promise<ListedMagistratNominationFilesDto> {
    return this.listMagistratNominationFilesQuery.handle(query);
  }

  listObservations(query: {
    magistratId: string;
    pagination: Pagination;
  }): Promise<ListedMagistratObservationsDto> {
    return this.listMagistratObservationsQuery.handle(query);
  }

  searchMagistrats(query: {
    search: string | undefined;
    ignoreIds: readonly string[] | undefined;
    pagination: Pagination;
  }): Promise<SearchMagistratsResponseDto> {
    return this.searchMagistratsQuery.handle(query);
  }
}
