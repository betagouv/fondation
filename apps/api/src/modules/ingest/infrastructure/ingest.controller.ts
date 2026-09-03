import {
  BadRequestException,
  Controller,
  Headers,
  HttpStatus,
  Inject,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { isScriptDivergent } from '../domain/divergent-script';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { MulterFile } from 'src/modules/framework/files/multipart/multipart.types';
import { Mattermost } from 'src/modules/framework/mattermost';
import { HasRole, IsMachine } from 'src/modules/simple-auth';

import { IngestedLolfiArchiveDto } from './ingest.dto';
import { IngestService } from './ingest.service';

@Controller('/api/ingest/v1')
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  constructor(
    private readonly ingest: IngestService,
    private readonly mattermost: Mattermost,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {}

  private async alertOnDivergentScript(call: {
    fromRelay: boolean;
    announced: string | undefined;
  }): Promise<void> {
    const expected = this.config.lolfiScriptDigest;
    if (!isScriptDivergent({ ...call, expected })) return;

    const text = `La copie en service sur le relais annonce "${call.announced ?? 'aucune empreinte'}" alors que le dépôt attend "${expected}". Le script doit être recopié.`;
    this.logger.error(text);

    await this.mattermost.alert({ title: ':alert: Script du relais SDV divergent', text });
  }

  @Post('/lolfi')
  @HasRole('ADMIN', 'MACHINE')
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
  async ingestLolfiArchive(
    @UploadedFile('file') file: MulterFile,
    @Headers('x-script-digest') scriptDigest: string | undefined,
    @IsMachine() isMachine: boolean,
  ): Promise<IngestedLolfiArchiveDto> {
    await this.alertOnDivergentScript({ fromRelay: isMachine, announced: scriptDigest });

    const result = await this.ingest.ingestLolfiArchive(file.buffer, {
      type: file.mimetype,
    });

    if (result.status === 'FAILED') {
      throw new BadRequestException({ errors: result.errors });
    }

    return result;
  }
}
