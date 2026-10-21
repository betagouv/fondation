import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
  UseFilters,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'download', required: false, type: 'string' })
  async getFileByFileUrl(
    @Res({ passthrough: true }) res: ExpressResponse,
    @Param('fileUrlId', ParseUUIDPipe) fileUrlId: string,
    @Query('download') download?: string,
  ): Promise<StreamableFile> {
    const { file, expiresAt } = await this.files.getFileContent(fileUrlId, {
      download: download !== undefined,
    });
    res.set('Expires', expiresAt.toUTCString() /* RFC5322 */);

    return file;
  }
}
