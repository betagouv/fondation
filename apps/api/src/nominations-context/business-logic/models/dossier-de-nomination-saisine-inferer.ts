import { Magistrat } from 'shared-models';
import {
  DossierDeNomination,
  DossierDeNominationTransparence,
} from './dossier-de-nomination';
import { z } from 'zod';

export class DossierDeNominationSaisineInferer {
  static parseTransparence(dossierDeNomination: DossierDeNomination) {
    const schema = z.object({
      folderNumber: z.number().nullable(),
      name: z.string(),
      formation: z.nativeEnum(Magistrat.Formation),
      dueDate: z
        .object({
          day: z.number(),
          month: z.number(),
          year: z.number(),
        })
        .nullable(),
      grade: z.nativeEnum(Magistrat.Grade),
      currentPosition: z.string(),
      targettedPosition: z.string(),
      rank: z.string(),
      birthDate: z.object({
        day: z.number(),
        month: z.number(),
        year: z.number(),
      }),
      biography: z.string().nullable(),
      observers: z.array(z.string()).nullable(),
    });

    schema.parse(dossierDeNomination.content);

    return new DossierDeNominationTransparence(dossierDeNomination);
  }
}
