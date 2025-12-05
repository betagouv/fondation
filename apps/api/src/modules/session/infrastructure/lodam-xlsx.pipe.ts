import { BadRequestException, Logger, PipeTransform } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { ImportNominationSessionFromLodamXlsxDto } from './dtos/nomination-session.dto';

import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { lodamXlsxToNominationSession } from '../domain/lodam-xlsx-to-nomination-session';
import { CreateNominationSessionCommand } from '../domain/nomination-session';

export class LodamXlsxPipe
  implements
    PipeTransform<
      ImportNominationSessionFromLodamXlsxDto,
      Promise<LodamNominationSession>
    >
{
  async transform(value: ImportNominationSessionFromLodamXlsxDto) {
    const { file, form } = value;

    const result = await lodamXlsxToNominationSession({
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

    const date = DateOnly.fromString(form.date, 'yyyy-MM-dd');
    const observationClosingDate = DateOnly.fromString(
      form.observationClosingDate,
      'yyyy-MM-dd',
    );
    const dueDate = form.dueDate
      ? DateOnly.fromString(form.dueDate, 'yyyy-MM-dd')
      : null;
    const positionStartDate = form.positionStartDate
      ? DateOnly.fromString(form.positionStartDate, 'yyyy-MM-dd')
      : null;

    return {
      date,
      dueDate,
      positionStartDate,
      observationClosingDate,

      name: form.name,
      formation: form.formation,

      files: result.files,
    };
  }
}

export class LodamXlsxImportErrorReport extends createZodDto(
  z.object({ validationErrors: z.array(z.string()) }),
) {}

export type LodamNominationSession = Omit<
  CreateNominationSessionCommand,
  'typeDeSaisine' | 'formationMembers'
>;
