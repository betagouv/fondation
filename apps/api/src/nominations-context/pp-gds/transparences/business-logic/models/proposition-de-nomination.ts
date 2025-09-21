import { Magistrat, TypeDeSaisine } from 'shared-models';
import {
  ContenuInconnu,
  ContenuV1,
  ContenuV2,
} from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import { DossierDeNomination } from 'src/nominations-context/dossier-de-nominations/business-logic/models/dossier-de-nomination';
import { dateOnlyJsonSchema } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';

export const propositionDeNominationTransparenceContentV1Schema = z.object({
  version: z.literal(1).optional().optional(),
  folderNumber: z.number().nullable(),
  name: z.string(),
  formation: z.nativeEnum(Magistrat.Formation),
  dueDate: dateOnlyJsonSchema.nullable(),
  grade: z.nativeEnum(Magistrat.Grade),
  currentPosition: z.string(),
  targettedPosition: z.string(),
  rank: z.string(),
  birthDate: dateOnlyJsonSchema,
  biography: z.string().nullable(),
  observers: z.array(z.string()).nullable(),
  datePassageAuGrade: dateOnlyJsonSchema.nullable(),
  datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
  informationCarrière: z.string().nullable(),
}) satisfies z.ZodType<ContenuV1>;

export const propositionDeNominationTransparenceContentV2Schema = z.object({
  version: z.literal(2),
  numeroDeDossier: z.number().nullable(),
  nomMagistrat: z.string(),
  posteCible: z.string(),
  dateDeNaissance: dateOnlyJsonSchema,
  posteActuel: z.string(),
  observants: z.array(z.string()).nullable(),
  historique: z.string().nullable(),
  rang: z.string(),
  grade: z.nativeEnum(Magistrat.Grade),
  datePassageAuGrade: dateOnlyJsonSchema.nullable(),
  datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
  informationCarrière: z.string().nullable(),
  dateEchéance: dateOnlyJsonSchema.nullable(),
}) satisfies z.ZodType<ContenuV2>;

export class PropositionDeNominationTransparence extends DossierDeNomination<TypeDeSaisine.TRANSPARENCE_GDS> {
  updateFolderNumber(
    content:
      | Pick<ContenuV1, 'version' | 'folderNumber'>
      | Pick<ContenuV2, 'version' | 'numeroDeDossier'>,
  ) {
    if (content.version === undefined || content.version === 1) {
      this.updateContent<typeof content>({
        folderNumber: content.folderNumber,
      });
    } else if (content.version === 2) {
      this.updateContent<typeof content>({
        numeroDeDossier: content.numeroDeDossier,
      });
    }
  }

  updateObservers(
    content:
      | Pick<ContenuV1, 'version' | 'observers'>
      | Pick<ContenuV2, 'version' | 'observants'>,
  ) {
    if (content.version === undefined || content.version === 1) {
      this.updateContent<typeof content>({
        observers: content.observers,
      });
    } else if (content.version === 2) {
      this.updateContent<typeof content>({
        observants: content.observants,
      });
    }
  }

  updateDatePassageAuGrade(
    datePassageAuGrade:
      | ContenuV1['datePassageAuGrade']
      | ContenuV2['datePassageAuGrade'],
  ) {
    this.updateContent({
      datePassageAuGrade,
    });
  }

  updateDatePriseDeFonctionPosteActuel(
    datePriseDeFonctionPosteActuel:
      | ContenuV1['datePriseDeFonctionPosteActuel']
      | ContenuV2['datePriseDeFonctionPosteActuel'],
  ) {
    this.updateContent({
      datePriseDeFonctionPosteActuel,
    });
  }

  updateInformationCarrière(
    informationCarrière:
      | ContenuV1['informationCarrière']
      | ContenuV2['informationCarrière'],
  ) {
    this.updateContent({
      informationCarrière,
    });
  }

  static fromDossierDeNomination(dossierDeNomination: DossierDeNomination) {
    const snapshot = dossierDeNomination.snapshot();

    const content = PropositionDeNominationTransparence.getSafeContent(
      snapshot.content,
    );

    return new PropositionDeNominationTransparence(
      snapshot.id,
      snapshot.sessionId,
      snapshot.nominationFileImportedId,
      content,
    );
  }

  static getSafeContent(content: ContenuInconnu): ContenuV1 | ContenuV2 {
    if ('version' in content) {
      return propositionDeNominationTransparenceContentV2Schema.parse(content);
    }
    return propositionDeNominationTransparenceContentV1Schema.parse(content);
  }
}
