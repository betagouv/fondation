import { Controller, Get, HttpStatus, Query, UsePipes } from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Role } from 'shared-models';

import { HasRole } from '../simple-auth';

import { SearchJurisdictionQueryDto } from './infrastructure/dtos/jurisdictions.dto';
import { JurisdictionsService } from './infrastructure/jurisdictions.service';
import { ListedJurisdictions } from './infrastructure/queries/search-jurisdictions.query';

@Controller('/api/jurisdictions/v1')
export class JurisdictionsController {
  constructor(private readonly jurisdictions: JurisdictionsService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get()
  @ZodResponse({ type: ListedJurisdictions, status: HttpStatus.OK })
  @UsePipes(ZodValidationPipe)
  search(@Query() query: SearchJurisdictionQueryDto): Promise<ListedJurisdictions> {
    return this.jurisdictions.search({
      search: query.search,
      includeIds: query.includeIds,
    });
  }
}
