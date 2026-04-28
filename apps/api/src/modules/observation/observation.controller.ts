import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseInterceptors,
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
import { AuthedUser, AuthedUserId, HasRole } from 'src/modules/simple-auth';

import {
  AttachMemberCommentScreenshotsDto,
  AttachedMemberCommentScreenshotsDto,
  WriteMemberCommentDto,
} from './infrastructure/dtos/observation-member-comment.dto';
import {
  CreateObservationDto,
  CreateObservationResponseDto,
  FollowUpOnObservationDto,
  UpdateObservationDto,
} from './infrastructure/dtos/observation.dto';
import { ObservationsFilter } from './infrastructure/observation.filter';
import { GetObservationDetailsResponseDto } from './infrastructure/queries/get-observation-details.query';
import { GetObservationFileUrlResponseDto } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsResponseDto } from './infrastructure/queries/list-observations.query';
import { ObservationService } from './observation.service';

@ApiTags('Observations')
@ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
@ApiParam({ name: 'nominationFileId', type: 'string', format: 'uuid' })
@UseInterceptors(ObservationsFilter)
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
    @Body() { files, form }: Multipart<typeof CreateObservationDto>,
  ): Promise<{ id: string }> {
    return this.observations.createObservation({
      userId,
      sessionId,
      files: files ?? [],
      nominationFileId,
      magistratId: form.magistratId,
      dateReception: new Date(form.dateReception),
      description: form.description,
      linkedAttachments: form.linkedObservationsAttachments,
    });
  }

  @Get()
  @HasRole()
  @ZodResponse({
    type: ListObservationsResponseDto,
    status: HttpStatus.OK,
  })
  async listObservations(
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<ListObservationsResponseDto> {
    return this.observations.listObservations({
      nominationFileId,
    });
  }

  @Get('/:observationId')
  @HasRole()
  @ZodResponse({
    type: GetObservationDetailsResponseDto,
    status: HttpStatus.OK,
  })
  async getObservationDetails(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Param('observationId') observationId: string,
  ): Promise<GetObservationDetailsResponseDto> {
    return this.observations.getObservationDetails({
      userId,
      sessionId,
      nominationFileId,
      observationId,
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
      `sessions/${request.params.sessionId}/observations/${request.params.nominationFileId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateObservation(
    @Param('observationId') observationId: string,
    @Body() { form, files }: Multipart<typeof UpdateObservationDto>,
  ): Promise<void> {
    await this.observations.updateObservation({
      observationId,
      dateReception: new Date(form.dateReception),
      magistratId: form.magistratId,
      description: form.description,
      filesToAttach: files ?? [],
      fileIdsToDetach: form.detachFileIds ?? [],
      linkedFiles: form.linkedObservationsAttachments,
    });
  }

  @Post('/:observationId/member-comments/screenshots')
  @HasRole()
  @UseMultipartBody({
    schema: AttachMemberCommentScreenshotsDto,
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/observations/${request.params.nominationFileId}/member-comments/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.OK,
    type: AttachedMemberCommentScreenshotsDto,
  })
  async attachMemberCommentScreenshots(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Param('observationId') observationId: string,
    @Body() { files }: Multipart<typeof AttachMemberCommentScreenshotsDto>,
  ): Promise<AttachedMemberCommentScreenshotsDto> {
    return this.observations.attachMemberCommentScreenshots({
      userId,
      sessionId,
      nominationFileId,
      observationId,
      files,
    });
  }

  @Put('/:observationId/member-comments')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async writeMemberComment(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Param('observationId') observationId: string,
    @Body() { comment }: WriteMemberCommentDto,
  ): Promise<void> {
    await this.observations.writeMemberComment({
      userId,
      sessionId,
      nominationFileId,
      observationId,
      comment,
    });
  }

  @Put('/:observationId/follow-up')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async followUpOnObservation(
    @AuthedUser() user: { id: string },
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Body() { followUp, comment }: FollowUpOnObservationDto,
  ) {
    await this.observations.followUpWith({
      userId: user.id,
      observationId,
      followUp,
      comment,
    });
  }
}
