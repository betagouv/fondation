import { Body, Controller, Header, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import * as time from '../../utils/time';
import { HasApiScope } from '../api-clients';
import { HasRole } from '../simple-auth';

import {
  InvalidMagistratEmailDto,
  SearchMagistratAuthorizationDto,
  SearchMagistratAuthorizationUnauthorizedDto,
} from './infrastructure/magistrat.dto';
import {
  IdentifiedMagistratDto,
  IdentifyMagistratDto,
  IdentifyMagistratQuery,
} from './infrastructure/queries/identify-magistrat.query';
import {
  FoundMagistratAuthorizationDto,
  SearchMagistratAuthorizationQuery,
} from './infrastructure/queries/search-magistrat-authorization.query';

@ApiTags('Magistrats')
@Controller('/api/public/v1')
export class MagistratPublicController {
  constructor(
    private readonly identifyMagistratQuery: IdentifyMagistratQuery,
    private readonly searchMagistratAuthorizationQuery: SearchMagistratAuthorizationQuery,
  ) {}

  @HasApiScope('magistrats:identification')
  @Post('/magistrats/identification')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: IdentifiedMagistratDto })
  @ZodResponse<any>({ status: HttpStatus.BAD_REQUEST, type: InvalidMagistratEmailDto })
  identifyMagistrat(@Body() body: IdentifyMagistratDto): Promise<IdentifiedMagistratDto> {
    return this.identifyMagistratQuery.handle({ email: body.email });
  }

  @ApiBearerAuth()
  @HasRole('MACHINE')
  @Post('/magistrats/role')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: FoundMagistratAuthorizationDto })
  @ZodResponse<any>({ status: HttpStatus.UNAUTHORIZED, type: SearchMagistratAuthorizationUnauthorizedDto })
  @ZodResponse<any>({ status: HttpStatus.BAD_REQUEST, type: InvalidMagistratEmailDto })
  @Header('Cache-Control', `max-age=${(1 * time.DAYS) / time.SECONDS}, private`)
  searchMagistratAuthorization(
    @Body() body: SearchMagistratAuthorizationDto,
  ): Promise<FoundMagistratAuthorizationDto> {
    return this.searchMagistratAuthorizationQuery.handle({ email: body.email });
  }
}
