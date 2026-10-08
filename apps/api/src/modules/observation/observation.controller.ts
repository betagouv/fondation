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

import { FILE_EXTENSIONS, UseMultipartBody, type Multipart } from 'src/modules/framework/files';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, AuthedUserId, HasRole } from 'src/modules/simple-auth';
import { DateOnly } from 'src/utils/date-only';

import {
  AttachMemberCommentScreenshotsDto,
  AttachedMemberCommentScreenshotsDto,
  WriteMemberCommentDto,
} from './infrastructure/dtos/observation-member-comment.dto';
import {
  CreateObservationDto,
  CreateObservationResponseDto,
  FollowUpOnObservationDto,
  ScheduleObservantAuditionDto,
  UpdateObservationDto,
} from './infrastructure/dtos/observation.dto';
import { ObservationsFilter } from './infrastructure/observation.filter';
import { GetObservationDetailsResponseDto } from './infrastructure/queries/get-observation-details.query';
import { GetObservationFileUrlResponseDto } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsResponseDto } from './infrastructure/queries/list-observations.query';
import { ObservationService } from './observation.service';

@ApiTags('Observations')
@ApiParam({ format: 'uuid', name: 'sessionId', type: 'string' })
@ApiParam({ format: 'uuid', name: 'nominationFileId', type: 'string' })
@UseInterceptors(ObservationsFilter)
@Controller('/api/sessions/v2/:sessionId/files/:nominationFileId/observations')
export class ObservationController {
  constructor(private readonly observations: ObservationService) {}

  @Post()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UseMultipartBody({
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/observations/${request.params.nominationFileId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    schema: CreateObservationDto,
  })
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreateObservationResponseDto,
  })
  async createObservation(
    @AuthedUserId() userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Body() { files, form }: Multipart<typeof CreateObservationDto>,
  ): Promise<{ id: string }> {
    return this.observations.createObservation({
      dateReception: new Date(form.dateReception),
      description: form.description,
      files: files ?? [],
      linkedAttachments: form.linkedObservationsAttachments,
      magistratId: form.magistratId,
      nominationFileId,
      sessionId,
      userId,
    });
  }

  @Get()
  @HasRole()
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListObservationsResponseDto,
  })
  async listObservations(
    @AuthedUser() user: { role: RoleEnum },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
  ): Promise<ListObservationsResponseDto> {
    return this.observations.listObservations({
      nominationFileId,
      role: user.role,
      sessionId,
    });
  }

  @Get('/:observationId')
  @HasRole()
  @ZodResponse({
    status: HttpStatus.OK,
    type: GetObservationDetailsResponseDto,
  })
  async getObservationDetails(
    @AuthedUser() user: { id: string; role: RoleEnum },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Param('observationId', ParseUUIDPipe) observationId: string,
  ): Promise<GetObservationDetailsResponseDto> {
    return this.observations.getObservationDetails({
      nominationFileId,
      observationId,
      role: user.role,
      sessionId,
      userId: user.id,
    });
  }

  @Get('/:observationId/files/:fileId/url')
  @HasRole()
  @ZodResponse({
    status: HttpStatus.OK,
    type: GetObservationFileUrlResponseDto,
  })
  async getObservationFileUrl(
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<GetObservationFileUrlResponseDto> {
    return this.observations.getObservationFileUrl({
      fileId,
      observationId,
    });
  }

  @Delete('/:observationId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteObservation(
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
  ): Promise<void> {
    await this.observations.deleteObservation({
      impersonatorId: user.impersonation?.impersonatorId ?? null,
      observationId,
      userId: user.id,
    });
  }

  @Patch('/:observationId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UseMultipartBody({
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/observations/${request.params.nominationFileId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    schema: UpdateObservationDto,
  })
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateObservation(
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Body() { form, files }: Multipart<typeof UpdateObservationDto>,
  ): Promise<void> {
    await this.observations.updateObservation({
      dateReception: new Date(form.dateReception),
      description: form.description,
      fileIdsToDetach: form.detachFileIds ?? [],
      filesToAttach: files ?? [],
      impersonatorId: user.impersonation?.impersonatorId ?? null,
      linkedFiles: form.linkedObservationsAttachments,
      magistratId: form.magistratId,
      observationId,
      userId: user.id,
    });
  }

  @Post('/:observationId/member-comments/screenshots')
  @HasRole()
  @UseMultipartBody({
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/observations/${request.params.nominationFileId}/member-comments/${id}.${FILE_EXTENSIONS[mimetype]}`,
    schema: AttachMemberCommentScreenshotsDto,
  })
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.OK,
    type: AttachedMemberCommentScreenshotsDto,
  })
  async attachMemberCommentScreenshots(
    @AuthedUserId() userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Body() { files }: Multipart<typeof AttachMemberCommentScreenshotsDto>,
  ): Promise<AttachedMemberCommentScreenshotsDto> {
    return this.observations.attachMemberCommentScreenshots({
      files,
      nominationFileId,
      observationId,
      sessionId,
      userId,
    });
  }

  @Put('/:observationId/member-comments')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async writeMemberComment(
    @AuthedUserId() userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Body() { comment }: WriteMemberCommentDto,
  ): Promise<void> {
    await this.observations.writeMemberComment({
      comment,
      nominationFileId,
      observationId,
      sessionId,
      userId,
    });
  }

  @Put('/:observationId/audition/schedule')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async scheduleObservantAudition(
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Body() { auditionDate, auditionTime }: ScheduleObservantAuditionDto,
  ): Promise<void> {
    await this.observations.scheduleObservantAudition({
      auditionDateTime:
        auditionDate && auditionTime ? { date: DateOnly.fromJson(auditionDate), time: auditionTime } : null,
      impersonatorId: user.impersonation?.impersonatorId ?? null,
      nominationFileId,
      observationId,
      sessionId,
      userId: user.id,
    });
  }

  @Put('/:observationId/follow-up')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async followUpOnObservation(
    @AuthedUser() user: { id: string },
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Body() { followUp, comment }: FollowUpOnObservationDto,
  ) {
    await this.observations.followUpWith({
      comment,
      followUp,
      observationId,
      userId: user.id,
    });
  }
}
