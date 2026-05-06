import {
  BadRequestException,
  Controller,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Role } from 'shared-models';

import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { MulterFile } from 'src/modules/framework/files/multipart/multipart.types';
import { HasRole } from 'src/modules/simple-auth';

import { IngestedLolfiArchiveDto } from './ingest.dto';
import { IngestService } from './ingest.service';

@Controller('/api/ingest/v1')
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  @Post('/lolfi')
  @HasRole(Role.ADMIN, 'MACHINE')
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
        callback(null, file.mimetype === FILE_MIME_TYPES.zip || file.mimetype === FILE_MIME_TYPES.smime);
      },
    }),
  )
  @ZodResponse({ status: HttpStatus.OK, type: IngestedLolfiArchiveDto })
  async ingestLolfiArchive(@UploadedFile('file') file: MulterFile): Promise<IngestedLolfiArchiveDto> {
    const result = await this.ingest.ingestLolfiArchive(file.buffer, {
      type: file.mimetype,
    });

    if (result.status === 'FAILED') {
      throw new BadRequestException({ errors: result.errors });
    }

    return result;
  }
}
