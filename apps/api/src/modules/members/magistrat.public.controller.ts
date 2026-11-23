import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import * as time from '../../utils/time';
import { HasApiScope } from '../api-clients';

import { InvalidMagistratEmailDto } from './infrastructure/magistrat.dto';
import {
  FindMagistratStatusQuery,
  FoundMagistratStatusDto,
} from './infrastructure/queries/find-magistrat-status.query';
import {
  IdentifiedMagistratDto,
  IdentifyMagistratDto,
  IdentifyMagistratQuery,
} from './infrastructure/queries/identify-magistrat.query';

@ApiTags('Magistrats')
@Controller('/api/public/v1')
export class MagistratPublicController {
  constructor(
    private readonly findMagistratStatusQuery: FindMagistratStatusQuery,
    private readonly identifyMagistratQuery: IdentifyMagistratQuery,
  ) {}

  @HasApiScope('magistrats:identification')
  @Post('/magistrats/identification')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: IdentifiedMagistratDto })
  @ZodResponse<any>({ status: HttpStatus.BAD_REQUEST, type: InvalidMagistratEmailDto })
  identifyMagistrat(@Body() body: IdentifyMagistratDto): Promise<IdentifiedMagistratDto> {
    return this.identifyMagistratQuery.handle({ email: body.email });
  }

  @HasApiScope('magistrats:status')
  @Get('/magistrats/:magistratId/status')
  @ZodResponse({ status: HttpStatus.OK, type: FoundMagistratStatusDto })
  @ApiBadRequestResponse({ description: 'The identifier is not a UUID' })
  @ApiNotFoundResponse({ description: 'No _Magistrat_ has this identifier: its status could not be checked' })
  // Lets the website keep a status for a day instead of asking again
  @Header('Cache-Control', `private, max-age=${(1 * time.DAYS) / time.SECONDS}`)
  findMagistratStatus(
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
  ): Promise<FoundMagistratStatusDto> {
    return this.findMagistratStatusQuery.handle({ magistratId });
  }
}
