import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { MulterFile } from 'src/modules/framework/files/multipart/multipart.types';
import { IngestService } from './ingest.service';

@Controller('/ingest/v1')
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  // TODO: adds auth -> Only ADMIN and authorized API Keys
  @Post('/lolfi')
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
      fileFilter(_req, file, callback) {
        callback(null, file.mimetype === FILE_MIME_TYPES.zip);
      },
    }),
  )
  async ingestLolfiArchive(@UploadedFile('file') file: MulterFile) {
    const result = await this.ingest.ingestLolfiArchive(file.buffer);
    if (result.status === 'FAILED') {
      throw new BadRequestException({ errors: result.errors });
    }

    return result;
  }
}
