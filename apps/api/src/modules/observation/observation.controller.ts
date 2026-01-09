import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  CreateObservationQueryDto,
  CreateObservationResponseDto,
  ListObservationsQueryDto,
  SearchMagistratsQueryDto,
} from './infrastructure/dtos/observation.dto';
import { GetObservationFileUrlResponseDto } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsResponseDto } from './infrastructure/queries/list-observations.query';
import { SearchMagistratsResponseDto } from './infrastructure/queries/search-magistrats.query';
import { ObservationService } from './observation.service';

@ApiTags('observations')
@Controller('/api/observations/v1')
export class ObservationController {
  constructor(private readonly observations: ObservationService) {}

  @Post('/:nominationFileId')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @UseMultipartBody({
    schema: CreateObservationDto,
    destination: ({ request, id, mimetype }) =>
      `observations/${request.params.nominationFileId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    type: CreateObservationResponseDto,
    status: HttpStatus.CREATED,
  })
  async createObservation(
    @Param('nominationFileId') nominationFileId: string,
    @Query() query: CreateObservationQueryDto,
    @Body()
    body: Multipart<typeof CreateObservationDto>,
    @AuthedUserId() userId: string,
  ): Promise<{ id: string }> {
    return this.observations.createObservation({
      userId,
      nominationFileId,
      magistratId: query.magistratId,
      dateReception: new Date(query.dateReception),
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

  @Get('/magistrats/search')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    type: SearchMagistratsResponseDto,
    status: HttpStatus.OK,
  })
  async searchMagistrats(
    @Query() query: SearchMagistratsQueryDto,
  ): Promise<SearchMagistratsResponseDto> {
    return this.observations.searchMagistrats({
      search: query.search,
      limit: query.limit,
    });
  }
}
