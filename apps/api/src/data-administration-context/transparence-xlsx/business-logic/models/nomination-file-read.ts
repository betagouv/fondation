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
    priseDeFonction: string;
    passageAuGrade: DateOnlyJson;
    observers: string[] | null;
    reporters: string[] | null;
    informationCarriere: string;
    historique: string | null;
    grade: Magistrat.Grade;
  };
};

export const nominationFileReadContentSchema = z.object({
  numeroDeDossier: z.number().nullable(),
  magistrat: z.string(),
  posteCible: z.string(),
  dateDeNaissance: z.object({
    year: z.number(),
    month: z.number().min(1).max(12) as ZodType<Month>,
    day: z.number(),
  }),
  posteActuel: z.string(),
  priseDeFonction: z.string(),
  passageAuGrade: z.object({
    year: z.number(),
    month: z.number().min(1).max(12) as ZodType<Month>,
    day: z.number(),
  }),
  observers: z.array(z.string()).nullable(),
  reporters: z.array(z.string()).nullable(),
  informationCarriere: z.string(),
  historique: z.string().nullable(),
  grade: z.nativeEnum(Magistrat.Grade),
}) satisfies ZodType<NominationFileRead['content']>;

export const nominationFileReadSchema = z.object({
  rowNumber: z.number(),
  content: nominationFileReadContentSchema,
}) satisfies ZodType<NominationFileRead>;

export const nominationFileReadListSchema =
  nominationFileReadSchema.array() satisfies ZodType<NominationFileRead[]>;
