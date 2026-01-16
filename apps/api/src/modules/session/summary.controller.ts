import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Role } from 'shared-models';
import {
  FILE_EXTENSIONS,
  Multipart,
  UseMultipartBody,
} from 'src/modules/framework/files';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import {
  AttachSummaryFilesDto,
  CreatedSummaryDto,
  DetachSummaryFilesQueryDto,
  IncludedFilesInSummaryContentDto,
  IncludeFilesInSummaryContentDto,
  UpdateSummaryReadersListDto,
  WriteSummaryContentDto,
} from './infrastructure/dtos/summary.dto';
import { DetailedSummaryDto } from './infrastructure/queries/detail-summary.query';
import { SummaryFilter } from './infrastructure/summary.filter';
import { SummaryService } from './infrastructure/summary.service';

@ApiTags('Summaries')
@ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
@ApiParam({ name: 'nominationFileId', type: 'string', format: 'uuid' })
@UseInterceptors(SummaryFilter)
@Controller('/api/sessions/v2/:sessionId/files/:nominationFileId/summary')
export class SummaryController {
  constructor(private readonly summaries: SummaryService) {}

  @Post()
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreatedSummaryDto })
  createSummary(
    @AuthedUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<CreatedSummaryDto> {
    return this.summaries.create({
      userId: user.id,
      sessionId,
      nominationFileId,
    });
  }

  @Post('/attachments')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    schema: AttachSummaryFilesDto,
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/files/${request.params.nominationFileId}/summary/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async attachFiles(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: Multipart<typeof AttachSummaryFilesDto>,
  ): Promise<void> {
    await this.summaries.attachFiles({
      sessionId,
      nominationFileId,
      fileIds: body.files.map(({ id }) => id),
    });
  }

  @Delete('/attachments')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  async detachFiles(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Query() { fileIds }: DetachSummaryFilesQueryDto,
  ): Promise<void> {
    await this.summaries.detachFiles({
      sessionId,
      nominationFileId,
      fileIds,
    });
  }

  @Post('/screenshots')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @UseMultipartBody({
    schema: IncludeFilesInSummaryContentDto,
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/files/${request.params.nominationFileId}/summary/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  @ZodResponse({
    status: HttpStatus.OK,
    type: IncludedFilesInSummaryContentDto,
  })
  async includeFilesInContent(
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() { files }: Multipart<typeof IncludeFilesInSummaryContentDto>,
  ): Promise<IncludedFilesInSummaryContentDto> {
    return this.summaries.includeFilesIntoContent({
      sessionId,
      nominationFileId,
      files,
    });
  }

  @Put('/content')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  async writeSummary(
    @AuthedUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() body: WriteSummaryContentDto,
  ): Promise<void> {
    await this.summaries.writeContent({
      userId: user.id,
      sessionId,
      nominationFileId,
      content: body.content,
    });
  }

  @Put('/readers')
  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateReadersList(
    @AuthedUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() { readerIds }: UpdateSummaryReadersListDto,
  ): Promise<void> {
    await this.summaries.updateReadersList({
      userId: user.id,
      sessionId,
      nominationFileId,
      readerIds,
    });
  }

  @Get()
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: DetailedSummaryDto })
  detailSummary(
    @AuthedUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
  ): Promise<DetailedSummaryDto> {
    return this.summaries.detailSummary({
      userId: user.id,
      sessionId,
      nominationFileId,
    });
  }
}
