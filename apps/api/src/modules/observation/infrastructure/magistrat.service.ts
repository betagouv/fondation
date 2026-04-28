import { Injectable } from '@nestjs/common';
import { Pagination } from 'src/modules/framework/pagination';
import {
  SearchMagistratsQuery,
  SearchMagistratsResponseDto,
} from './queries/search-magistrats.query';

@Injectable()
export class MagistratService {
  constructor(private readonly searchMagistratsQuery: SearchMagistratsQuery) {}

  searchMagistrats(query: {
    search: string | undefined;
    ignoreIds: readonly string[] | undefined;
    pagination: Pagination;
  }): Promise<SearchMagistratsResponseDto> {
    return this.searchMagistratsQuery.handle(query);
  }
}
