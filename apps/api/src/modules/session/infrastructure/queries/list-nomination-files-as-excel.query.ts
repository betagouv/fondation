/* eslint-disable */
import { Injectable, StreamableFile } from '@nestjs/common';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';

@Injectable()
export class ListNominationFilesAsExcelQuery {
  async handle(_query: { sessionId: string }): Promise<StreamableFile> {
    return new StreamableFile(Buffer.from([]), {
      type: FILE_MIME_TYPES.xlsx,
      disposition: `inline; filename="${encodeURIComponent(`dossiers-nomination-${new Date().toISOString().split('T')[0]}.xlsx`)}"`,
    });
  }
}
