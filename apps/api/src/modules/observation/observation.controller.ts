import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Role } from 'shared-models';
import {
  FILE_EXTENSIONS,
  UseMultipartBody,
  type Multipart,
} from 'src/modules/framework/files';
import { AuthedUserId, HasRole } from 'src/modules/simple-auth';

import {
  CreateObservationDto,
  CreateObservationResponseDto,
  ListObservationsQueryDto,
  UpdateObservationDto,
} from './infrastructure/dtos/observation.dto';
import { GetObservationFileUrlResponseDto } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsResponseDto } from './infrastructure/queries/list-observations.query';
import { ObservationService } from './observation.service';

@ApiTags('Sessions')
@ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
@ApiParam({ name: 'nominationFileId', type: 'string', format: 'uuid' })
@Controller('/api/sessions/v2/:sessionId/files/:nominationFileId/observations')
export class ObservationController {
  constructor(private readonly observations: ObservationService) {}

  @Post()
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @UseMultipartBody({
    schema: CreateObservationDto,
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/observations/${request.params.nominationFileId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    type: CreateObservationResponseDto,
    status: HttpStatus.CREATED,
  })
  async createObservation(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: Multipart<typeof CreateObservationDto>,
  ): Promise<{ id: string }> {
    return this.observations.createObservation({
      userId,
      sessionId,
      nominationFileId,
      magistratId: body.magistratId,
      dateReception: new Date(body.dateReception),
      files: (body.files ?? []).map((file) => ({
        id: file.id,
      })),
    });
  }

  @Get()
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    type: ListObservationsResponseDto,
    status: HttpStatus.OK,
  })
  async listObservations(
    @Query() query: ListObservationsQueryDto,
  ): Promise<ListObservationsResponseDto> {
    if (!query.nominationFileId) {
      return { observations: [] };
    }
    return this.observations.listObservations({
      nominationFileId: query.nominationFileId,
    });
  }

  @Get('/:observationId/files/:fileId/url')
  @HasRole()
  @ZodResponse({
    type: GetObservationFileUrlResponseDto,
    status: HttpStatus.OK,
  })
  async getObservationFileUrl(
    @Param('observationId') observationId: string,
    @Param('fileId') fileId: string,
  ): Promise<GetObservationFileUrlResponseDto> {
    return this.observations.getObservationFileUrl({
      observationId,
      fileId,
    });
  }

  @Delete('/:observationId')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteObservation(
    @Param('observationId') observationId: string,
    @AuthedUserId() userId: string,
  ): Promise<void> {
    await this.observations.deleteObservation({
      userId,
      observationId,
    });
  }

  @Patch('/:observationId')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @UseMultipartBody({
    schema: UpdateObservationDto,
    destination: ({ request, id, mimetype }) =>
      `observations/${request.params.observationId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateObservation(
    @Param('observationId') observationId: string,
    @Body() body: Multipart<typeof UpdateObservationDto>,
  ): Promise<void> {
    await this.observations.updateObservation({
      observationId,
      dateReception: new Date(body.dateReception),
      magistratId: body.magistratId,
      filesToAttach: (body.files ?? []).map((file) => ({ id: file.id })),
      fileIdsToDetach: body.detachFileIds ?? [],
    });
  }
}
