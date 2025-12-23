import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import { Files } from './files';

@Controller('/api/files/v1')
export class FilesController {
  constructor(private readonly files: Files) {}

  @Get('/:fileUrlId')
  async getFileByFileUrl(
    @Param('fileUrlId', ParseUUIDPipe) fileUrlId: string,
  ): Promise<StreamableFile> {
    return this.files.getFileContent(fileUrlId);
  }
}
