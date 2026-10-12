import { Body, Controller, Header, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { HasRole } from '../simple-auth';
import * as time from 'src/utils/time';

import {
  SearchMagistratAuthorizationDto,
  SearchMagistratAuthorizationInvalidEmailDto,
  SearchMagistratAuthorizationUnauthorizedDto,
} from './infrastructure/magistrat.dto';
import {
  FoundMagistratAuthorizationDto,
  SearchMagistratAuthorizationQuery,
} from './infrastructure/queries/search-magistrat-authorization.query';

@ApiTags('Magistrats')
@Controller('/api/public/v1')
export class MagistratPublicController {
  constructor(private readonly searchMagistratAuthorizationQuery: SearchMagistratAuthorizationQuery) {}

  @ApiBearerAuth()
  @HasRole('MACHINE')
  @Post('/magistrats/role')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: FoundMagistratAuthorizationDto })
  @ZodResponse<any>({ status: HttpStatus.UNAUTHORIZED, type: SearchMagistratAuthorizationUnauthorizedDto })
  @ZodResponse<any>({ status: HttpStatus.BAD_REQUEST, type: SearchMagistratAuthorizationInvalidEmailDto })
  @Header('Cache-Control', `max-age=${(1 * time.DAYS) / time.SECONDS}, private`)
  searchMagistratAuthorization(
    @Body() body: SearchMagistratAuthorizationDto,
  ): Promise<FoundMagistratAuthorizationDto> {
    return this.searchMagistratAuthorizationQuery.handle({ email: body.email });
  }
}
