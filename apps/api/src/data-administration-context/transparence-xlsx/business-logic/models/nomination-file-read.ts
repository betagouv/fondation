import { Magistrat } from 'shared-models';
import {
  DateOnly,
  DateOnlyJson,
} from 'src/shared-kernel/business-logic/models/date-only';
import { z, ZodType } from 'zod';
import { Avancement } from '../../../lodam/business-logic/models/avancement';

export type NominationFileRead = {
  rowNumber: number;
  content: {
    numeroDeDossier: number | null;
    magistrat: string;
    posteCible: string;
    dateDeNaissance: DateOnlyJson;
    posteActuel: string;
    datePriseDeFonctionPosteActuel: DateOnlyJson | null;
    datePassageAuGrade: DateOnlyJson | null;
    equivalenceOuAvancement: Avancement;
    grade: Magistrat.Grade;
    observers: string[] | null;
    reporters: string[] | null;
    informationCarriere: string | null;
    historique: string | null;
    rank: string;
  };
};

export const nominationFileReadContentSchema = z.object({
  numeroDeDossier: z.number().nullable(),
  magistrat: z.string(),
  posteCible: z.string(),
  dateDeNaissance: DateOnly.ZOD_JSON_SCHEMA,
  posteActuel: z.string(),
  datePriseDeFonctionPosteActuel: DateOnly.ZOD_JSON_SCHEMA.nullable(),
  datePassageAuGrade: DateOnly.ZOD_JSON_SCHEMA.nullable(),
  equivalenceOuAvancement: z.nativeEnum(Avancement),
  grade: z.nativeEnum(Magistrat.Grade),
  observers: z.array(z.string()).nullable(),
  reporters: z.array(z.string()).nullable(),
  informationCarriere: z.string().nullable(),
  historique: z.string().nullable(),
  rank: z.string(),
}) satisfies ZodType<NominationFileRead['content']>;

export const nominationFileReadSchema = z.object({
  rowNumber: z.number(),
  content: nominationFileReadContentSchema,
}) satisfies ZodType<NominationFileRead>;

export const nominationFileReadListSchema =
  nominationFileReadSchema.array() satisfies ZodType<NominationFileRead[]>;
