import { Magistrat, Month } from 'shared-models';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { z, ZodType } from 'zod';

export type NominationFileRead = {
  rowNumber: number;
  content: {
    folderNumber: number | null;
    name: string;
    dueDate: DateOnlyJson | null;
    reporters: string[] | null;
    grade: Magistrat.Grade;
    currentPosition: string;
    targettedPosition: string;
    rank: string;
    birthDate: DateOnlyJson;
    biography: string | null;
    observers: string[] | null;
  };
};

export const nominationFileReadContentSchema = z.object({
  folderNumber: z.number().nullable(),
  name: z.string(),
  dueDate: z
    .object({
      year: z.number(),
      month: z.number().min(1).max(12) as ZodType<Month>,
      day: z.number(),
    })
    .nullable(),
  reporters: z.array(z.string()).nullable(),
  grade: z.nativeEnum(Magistrat.Grade),
  currentPosition: z.string(),
  targettedPosition: z.string(),
  rank: z.string(),
  birthDate: z.object({
    year: z.number(),
    month: z.number().min(1).max(12) as ZodType<Month>,
    day: z.number(),
  }),
  biography: z.string().nullable(),
  observers: z.array(z.string()).nullable(),
}) satisfies ZodType<NominationFileRead['content']>;

export const nominationFileReadSchema = z.object({
  rowNumber: z.number(),
  content: nominationFileReadContentSchema,
}) satisfies ZodType<NominationFileRead>;

export const nominationFileReadListSchema =
  nominationFileReadSchema.array() satisfies ZodType<NominationFileRead[]>;
