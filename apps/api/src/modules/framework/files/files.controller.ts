import { Controller, Get, Param, ParseUUIDPipe, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';

import { Files } from './files';

@Controller('/api/files/v1')
export class FilesController {
  constructor(private readonly files: Files) {}

  @Get('/:fileUrlId')
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
