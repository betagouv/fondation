import { createZodDto } from 'nestjs-zod';
import { Magistrat } from 'shared-models';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import z from 'zod';

export class ImportNominationSessionFromLodamXlsxDto extends createZodDto(
  z.object({
    form: z.object({
      name: z.string().trim().min(1),
      date: z.iso.date(),
      observationClosingDate: z.iso.date(),
      dueDate: z.iso.date().nullish(),
      positionStartDate: z.iso.date().nullish(),
      formation: z.enum(Magistrat.Formation),
    }),
    file: z
      .file()
      .mime(FILE_MIME_TYPES.xlsx)
      .max(5 * 1_024 * 1_024 /* 5MB */),
  }),
) {}
