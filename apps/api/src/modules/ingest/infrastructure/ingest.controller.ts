import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { MulterFile } from 'src/modules/framework/files/multipart/multipart.types';
import { LolfiArchiveIngestor } from '../services/lolfi-archive-ingest';

@Controller('/ingest/v1')
export class IngestController {
  constructor(private readonly lolfiArchiveIngestor: LolfiArchiveIngestor) {}

  @Post('/lolfi')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'a .zip file' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 30 * 1_024 * 1_024 /* Mb */ },
      fileFilter(req, file, callback) {
        callback(null, file.mimetype === FILE_MIME_TYPES.zip);
      },
    }),
  )
  async ingestLolfiArchive(@UploadedFile('file') file: MulterFile) {
    const result = await this.lolfiArchiveIngestor.ingest(file.buffer);
    if (!result.success) {
      throw new BadRequestException({
        errors: result.errors,
      });
    }

    // TODO: start job and return job ID
  }
}
