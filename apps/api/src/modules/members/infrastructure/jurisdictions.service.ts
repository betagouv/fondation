import { Injectable } from '@nestjs/common';
import {
  FoundJurisdictionsItem,
  SearchJurisdictionsQuery,
} from './queries/search-jurisdictions.query';

@Injectable()
export class JurisdictionsService {
  constructor(
    private readonly searchJurisdictionsQuery: SearchJurisdictionsQuery,
  ) {}

  search(query: {
    search: string | undefined;
    includeIds: string[] | undefined;
  }): Promise<{ items: FoundJurisdictionsItem[] }> {
    return this.searchJurisdictionsQuery.handle(query);
  }
}
