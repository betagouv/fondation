import { File } from 'node:buffer';

import { BadRequestException, PipeTransform } from '@nestjs/common';

import { DateOnly } from 'src/utils/date-only';
import { lodamXlsxToNominationFiles } from '../domain/lodam-xlsx-to-nomination-session';
import { LodamNominationFile } from '../domain/nomination-file';

export class LodamXlsxPipe implements PipeTransform<
  { file: File; form?: { date: DateOnly } },
  Promise<LodamNominationFile[]>
> {
  async transform(value: { file: File; form?: { date: DateOnly } }) {
    const { file } = value;

    const result = await lodamXlsxToNominationFiles({
      form: value.form,
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
