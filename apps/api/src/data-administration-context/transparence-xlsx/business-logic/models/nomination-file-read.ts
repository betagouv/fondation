import { Magistrat, Month } from 'shared-models';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { z, ZodType } from 'zod';

export type NominationFileRead = {
  rowNumber: number;
  content: {
    numeroDeDossier: number | null;
    magistrat: string;
    posteCible: string;
    dateDeNaissance: DateOnlyJson;
    posteActuel: string;
    priseDeFonction: DateOnlyJson;
    datePassageAuGrade: DateOnlyJson;
    equivalenceOuAvancement: 'E' | 'A';
    grade: Magistrat.Grade;
    observers: string[] | null;
    reporters: string[] | null;
    informationCarriere: string;
    historique: string | null;
  };
};

const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12) as ZodType<Month>,
  day: z.number(),
});
export const nominationFileReadContentSchema = z.object({
  numeroDeDossier: z.number().nullable(),
  magistrat: z.string(),
  posteCible: z.string(),
  dateDeNaissance: dateOnlyJsonSchema,
  posteActuel: z.string(),
  priseDeFonction: dateOnlyJsonSchema,
  datePassageAuGrade: z.object({
    year: z.number(),
    month: z.number().min(1).max(12) as ZodType<Month>,
    day: z.number(),
  }),
  equivalenceOuAvancement: z.enum(['E', 'A']),
  grade: z.nativeEnum(Magistrat.Grade),
  observers: z.array(z.string()).nullable(),
  reporters: z.array(z.string()).nullable(),
  informationCarriere: z.string(),
  historique: z.string().nullable(),
}) satisfies ZodType<NominationFileRead['content']>;

export const nominationFileReadSchema = z.object({
  rowNumber: z.number(),
  content: nominationFileReadContentSchema,
}) satisfies ZodType<NominationFileRead>;

export const nominationFileReadListSchema =
  nominationFileReadSchema.array() satisfies ZodType<NominationFileRead[]>;
