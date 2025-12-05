import { File } from 'node:buffer';

import { BadRequestException, PipeTransform } from '@nestjs/common';

import { lodamXlsxToNominationFiles } from '../domain/lodam-xlsx-to-nomination-session';
import { NominationFile } from '../domain/nomination-file';

export class LodamXlsxPipe
  implements PipeTransform<{ file: File }, Promise<NominationFile[]>>
{
  async transform(value: { file: File }) {
    const { file } = value;

    const result = await lodamXlsxToNominationFiles({
      file: Buffer.from(await file.arrayBuffer()),
    });

    if (!result.success) {
      throw new BadRequestException({
        validationErrors: result.errors.flatMap((error) =>
          error.messages.map(
            (message) =>
              `${'lineNumber' in error ? `l. ${error.lineNumber}` : `n°${error.fileNumber}`} ${message}`,
          ),
        ),
      });
    }

    return result.files;
  }
}
