import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { LolfiArchivePipe } from './pipes/lolfi-archive.pipe';

@Controller('/ingest/v1')
export class IngestController {
  constructor() {}

  @Post('/lolfi')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  ingestLolfiArchive(
    @UploadedFile('file', LolfiArchivePipe)
    items: { id: string; name: string }[],
  ) {
    return { items };
  }
}
