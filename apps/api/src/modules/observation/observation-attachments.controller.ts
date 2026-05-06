import { Controller, Get, HttpStatus, Param, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Role } from 'shared-models';

import { HasRole } from '../simple-auth';

import { ListObservationsAttachmentsQueryDto } from './infrastructure/dtos/observation.dto';
import { ListedObservationsAttachmentsDto } from './infrastructure/queries/list-observations-attachments.query';
import { ObservationService } from './observation.service';

@ApiTags('Observations')
@Controller('/api/sessions/v2/:sessionId/observations')
export class ObservationAttachmentsController {
  constructor(private readonly observations: ObservationService) {}

  @Get('/attachments')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedObservationsAttachmentsDto,
  })
  listObservationsAttachments(
    @Param('sessionId') sessionId: string,
    @Query() query: ListObservationsAttachmentsQueryDto,
  ): Promise<ListedObservationsAttachmentsDto> {
    return this.observations.listObservationsAttachments({
      sessionId,
      magistratId: query.magistratId,
      excludeObservationId: query.excludeObservationId,
    });
  }
}
