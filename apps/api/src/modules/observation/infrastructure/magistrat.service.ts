import { Injectable } from '@nestjs/common';

import { Pagination } from 'src/modules/framework/pagination';

import { DetailedMagistratDto, DetailMagistratQuery } from './queries/detail-magistrat.query';
import { SearchMagistratsQuery, SearchMagistratsResponseDto } from './queries/search-magistrats.query';

@Injectable()
export class MagistratService {
  constructor(
    private readonly searchMagistratsQuery: SearchMagistratsQuery,
    private readonly detailMagistratQuery: DetailMagistratQuery,
  ) {}

  detailMagistrat(query: { magistratId: string }): Promise<DetailedMagistratDto> {
    return this.detailMagistratQuery.handle(query);
  }

  searchMagistrats(query: {
    search: string | undefined;
    ignoreIds: readonly string[] | undefined;
    pagination: Pagination;
  }): Promise<SearchMagistratsResponseDto> {
    return this.searchMagistratsQuery.handle(query);
  }
}
