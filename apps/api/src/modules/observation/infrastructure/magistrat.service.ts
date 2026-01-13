import { Injectable } from '@nestjs/common';
import {
  SearchMagistratsQuery,
  SearchMagistratsResponseDto,
} from './queries/search-magistrats.query';
import { Pagination } from 'src/modules/framework/pagination';

@Injectable()
export class MagistratService {
  constructor(private readonly searchMagistratsQuery: SearchMagistratsQuery) {}

  searchMagistrats(query: {
    search: string | undefined;
    pagination: Pagination;
  }): Promise<SearchMagistratsResponseDto> {
    return this.searchMagistratsQuery.handle(query);
  }
}
