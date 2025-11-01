import { Controller, Get, Query } from '@nestjs/common';
import { HasRole } from '../simple-auth';
import { Role } from 'shared-models';
import { JurisdictionsService } from './infrastructure/jurisdictions.service';
import { FoundJurisdictionsItem } from './infrastructure/queries/search-jurisdictions.query';

@Controller('/api/jurisdictions/v1')
export class JurisdictionsController {
  constructor(private readonly jurisdictions: JurisdictionsService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get()
  search(
    @Query('search') searchQuery: string | undefined,
    @Query('includeIds') includeIdsQuery: string | undefined,
  ): Promise<{ items: FoundJurisdictionsItem[] }> {
    // TODO: extract to pipes since native Nest use class-transformer?
    const includeIds = includeIdsQuery?.split(',').map((x) => x.trim());
    const trimmed = searchQuery?.trim();
    const search = (trimmed?.length ?? 0) > 0 ? trimmed : undefined;

    return this.jurisdictions.search({
      search,
      includeIds,
    });
  }
}
