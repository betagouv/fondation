import { Magistrat, dateOnlyJsonSchema } from 'shared-models';
import z from 'zod/v4/classic/external.cjs';

export const NominationFileContentSchema = z
  .discriminatedUnion('version', [
    z.object({
      version: z.literal(1).nullish(),
      folderNumber: z.number().nullable(),
      name: z.string(),
      formation: z.enum(Magistrat.Formation),
      dueDate: dateOnlyJsonSchema.nullable(),
      grade: z.enum(Magistrat.Grade),
      currentPosition: z.string(),
      targettedPosition: z.string(),
      rank: z.string(),
      birthDate: dateOnlyJsonSchema,
      biography: z.string().nullable(),
      observers: z.array(z.string()).nullable(),
      datePassageAuGrade: dateOnlyJsonSchema.nullable(),
      datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
      informationCarrière: z.string().nullable(),
    }),
    z.object({
      version: z.literal(2),
      numeroDeDossier: z.number().nullable(),
      nomMagistrat: z.string(),
      dateEchéance: dateOnlyJsonSchema.nullable(),
      grade: z.enum(Magistrat.Grade),
      posteActuel: z.string(),
      posteCible: z.string(),
      rang: z.string(),
      dateDeNaissance: dateOnlyJsonSchema,
      historique: z.string().nullable(),
      observants: z.array(z.string()).nullable(),
      datePassageAuGrade: dateOnlyJsonSchema.nullable(),
      datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
      informationCarrière: z.string().nullable(),
    }),
  ])
  .transform((content) =>
    content.version === 2
      ? content
      : {
          version: 2,
          numeroDeDossier: content.folderNumber,
          nomMagistrat: content.name,
          dateEchéance: content.dueDate,
          grade: content.grade,
          posteActuel: content.currentPosition,
          posteCible: content.targettedPosition,
          rang: content.rank,
          dateDeNaissance: content.birthDate,
          historique: content.biography,
          observants: content.observers,
          datePassageAuGrade: content.datePassageAuGrade,
          datePriseDeFonctionPosteActuel:
            content.datePriseDeFonctionPosteActuel,
          informationCarrière: content.informationCarrière,
        },
  );
