import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Put, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

import { HasRole } from '../simple-auth';

import { UpdateObservationBlockTrackingDto } from './infrastructure/dtos/observation-block-tracking.dto';
import { ObservationService } from './observation.service';

@ApiTags('Observations')
@Controller('/api/sessions/v2/:sessionId/observation-blocks')
export class ObservationBlocksController {
  constructor(private readonly observations: ObservationService) {}

  @Put('/:magistratId/tracking')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateObservationBlockTracking(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
    @Body() { comment, status }: UpdateObservationBlockTrackingDto,
  ): Promise<void> {
    await this.observations.trackObservationBlock({ comment, magistratId, sessionId, status });
  }
}
