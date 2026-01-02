import { createZodDto } from 'nestjs-zod';
import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/utils/date-only';
import z from 'zod';

export class NominationFile extends createZodDto(
  z.object({
    fileNumber: z.number(),
    name: z.string(),
    rank: z.string().nullable(),
    grade: z.enum(Magistrat.Grade),
    targetedGrade: z.enum(Magistrat.Grade),
    targetedPosition: z.string(),
    birthDate: z.instanceof(DateOnly).nullable(),
    currentPosition: z.string(),
    lastPositionDate: z.instanceof(DateOnly).nullable(),
    lastRankingDate: z.instanceof(DateOnly).nullable(),
    observers: z.array(z.string()),
    reporters: z.array(z.string()),
    biography: z.string().nullable(),
    careerInformation: z.string().nullable(),
  }),
) {}

export type NominationFileEntity = { id: string } & NominationFile;
