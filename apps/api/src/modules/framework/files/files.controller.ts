import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
  UseFilters,
} from '@nestjs/common';
import { ApiHeader, ApiQuery } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';

import { HasRole } from '../../simple-auth';

import { Files } from './files';
import { MissingFromStorageFilter } from './missing-from-storage.filter';

@Controller('/api/files/v1')
@UseFilters(MissingFromStorageFilter)
export class FilesController {
  constructor(private readonly files: Files) {}

  @HasRole()
  @Get('/:fileUrlId')
  @ApiHeader({ description: 'the range of bytes a video player asks', name: 'range', required: false })
  @ApiQuery({ name: 'download', required: false, type: 'string' })
  async getFileByFileUrl(
    @Res({ passthrough: true }) res: ExpressResponse,
    @Param('fileUrlId', ParseUUIDPipe) fileUrlId: string,
    @Query('download') download?: string,
    @Headers('range') range?: string,
  ): Promise<StreamableFile> {
    const { contentRange, expiresAt, file } = await this.files.getFileContent(fileUrlId, {
      download: download !== undefined,
      range,
    });
    res.set('Accept-Ranges', 'bytes');
    res.set('Expires', expiresAt.toUTCString() /* RFC5322 */);
    if (contentRange) res.status(HttpStatus.PARTIAL_CONTENT).set('Content-Range', contentRange);

    return file;
  }
}
