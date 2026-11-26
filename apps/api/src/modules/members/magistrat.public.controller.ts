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
import { WideEvent } from '../framework/wide-event';

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
    private readonly wideEvent: WideEvent,
  ) {}

  @HasApiScope('magistrats:identification')
  @Post('/magistrats/identification')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: IdentifiedMagistratDto })
  @ZodResponse<any>({ status: HttpStatus.BAD_REQUEST, type: InvalidMagistratEmailDto })
  async identifyMagistrat(@Body() body: IdentifyMagistratDto): Promise<IdentifiedMagistratDto> {
    const identified = await this.identifyMagistratQuery.handle({ email: body.email });
    // The identifier tells whom the call was about, never the address it was asked with
    this.wideEvent.set({
      'fondation.magistrat.id': identified.status === 'ACTIVE' ? identified.magistrat.id : undefined,
      'fondation.magistrat.status': identified.status,
    });

    return identified;
  }

  @HasApiScope('magistrats:status')
  @Get('/magistrats/:magistratId/status')
  @ZodResponse({ status: HttpStatus.OK, type: FoundMagistratStatusDto })
  @ApiBadRequestResponse({ description: 'The identifier is not a UUID' })
  @ApiNotFoundResponse({ description: 'No _Magistrat_ has this identifier: its status could not be checked' })
  // Lets the website keep a status for a day instead of asking again
  @Header('Cache-Control', `private, max-age=${(1 * time.DAYS) / time.SECONDS}`)
  async findMagistratStatus(
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
  ): Promise<FoundMagistratStatusDto> {
    const found = await this.findMagistratStatusQuery.handle({ magistratId });
    this.wideEvent.set({ 'fondation.magistrat.status': found.status });

    return found;
  }
}
