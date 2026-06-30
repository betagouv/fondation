import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FILE_EXTENSIONS, Multipart, UseMultipartBody } from 'src/modules/framework/files';
import { AuthedUser, HasRole, SimpleAuthService } from 'src/modules/simple-auth';

import { DetailedSummaryDto } from './infrastructure/queries/detail-summary.query';
import { GeneratedSummaryAttachmentPublicUrlDto } from './infrastructure/queries/get-summary-attachment-url.query';
import {
  AttachSummaryFilesDto,
  CreatedSummaryDto,
  DetachSummaryFilesQueryDto,
  FoundSummaryReadersDto,
  IncludedFilesInSummaryContentDto,
  IncludeFilesInSummaryContentDto,
  SearchSummaryReaderDto,
  UpdateSummaryReadersListDto,
  WriteSummaryContentDto,
} from './infrastructure/summary.dto';
import { SummaryService } from './infrastructure/summary.service';
import { SummaryFilter } from './summary.filter';

@ApiTags('Summaries')
@ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
@ApiParam({ name: 'nominationFileId', type: 'string', format: 'uuid' })
@UseInterceptors(SummaryFilter)
@Controller('/api/sessions/v2/:sessionId/files/:nominationFileId/summary')
export class SummaryController {
  constructor(
    private readonly summaries: SummaryService,
    private readonly users: SimpleAuthService,
  ) {}

  @Post()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({ status: HttpStatus.CREATED, type: CreatedSummaryDto })
  createSummary(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
  ): Promise<CreatedSummaryDto> {
    return this.summaries.create({ sessionId, nominationFileId });
  }

  @Post('/attachments')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseMultipartBody({
    schema: AttachSummaryFilesDto,
    destination: ({ request, id, mimetype }) =>
      `sessions/${request.params.sessionId}/files/${request.params.nominationFileId}/summary/${id}.${FILE_EXTENSIONS[mimetype]}`,
  })
  async attachSummaryFiles(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Body() body: Multipart<typeof AttachSummaryFilesDto>,
  ): Promise<void> {
    await this.summaries.attachFiles({
      sessionId,
      nominationFileId,
      fileIds: body.files.map(({ id }) => id),
    });
  }

  @Delete('/attachments')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async detachSummaryFiles(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Query(ZodValidationPipe) { fileIds }: DetachSummaryFilesQueryDto,
  ): Promise<void> {
    await this.summaries.detachFiles({
      sessionId,
      nominationFileId,
      fileIds,
    });
  }

  @Post('/screenshots')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
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
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Body() { files }: Multipart<typeof IncludeFilesInSummaryContentDto>,
  ): Promise<IncludedFilesInSummaryContentDto> {
    return this.summaries.includeFilesIntoContent({
      sessionId,
      nominationFileId,
      files,
    });
  }

  @Put('/content')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async writeSummary(
    @AuthedUser() user: { id: string },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
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
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async updateSummaryReadersList(
    @AuthedUser() user: { id: string },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Body() { readerIds }: UpdateSummaryReadersListDto,
  ): Promise<void> {
    await this.summaries.updateReadersList({
      userId: user.id,
      sessionId,
      nominationFileId,
      readerIds,
    });
  }

  @Get('/attachments/:fileId/url')
  @HasRole()
  @ZodResponse({
    status: HttpStatus.OK,
    type: GeneratedSummaryAttachmentPublicUrlDto,
  })
  generateAttachmentPublicUrl(
    @AuthedUser() user: { id: string },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<GeneratedSummaryAttachmentPublicUrlDto> {
    return this.summaries.generateSummaryAttachmentPublicUrl({
      userId: user.id,
      sessionId,
      nominationFileId,
      fileId,
    });
  }

  @Get()
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: DetailedSummaryDto })
  detailSummary(
    @AuthedUser() user: { id: string },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('nominationFileId', ParseUUIDPipe) nominationFileId: string,
  ): Promise<DetailedSummaryDto> {
    return this.summaries.detailSummary({
      userId: user.id,
      sessionId,
      nominationFileId,
    });
  }

  @Get('/readers')
  @ZodResponse({ status: HttpStatus.OK, type: FoundSummaryReadersDto })
  @UsePipes(ZodValidationPipe)
  searchSummaryReaders(
    @AuthedUser() user: { id: string },
    @Query() query: SearchSummaryReaderDto,
  ): Promise<FoundSummaryReadersDto> {
    return this.users.listUsers({
      excludeIds: [user.id],
      includeIds: query.includeIds,
      search: query.search,
      limit: 20,
    });
  }
}
