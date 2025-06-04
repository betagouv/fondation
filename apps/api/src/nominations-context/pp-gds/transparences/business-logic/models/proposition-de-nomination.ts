import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import {
  ContenuInconnu,
  DossierDeNomination,
} from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { dateOnlyJsonSchema } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';

export interface ContenuPropositionDeNominationTransparenceV1 {
  version?: undefined;
  folderNumber: number | null;
  name: string;
  formation: Magistrat.Formation;
  dueDate: DateOnlyJson | null;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  birthDate: DateOnlyJson;
  biography: string | null;
  observers: string[] | null;
}

type ContenuV1 = ContenuPropositionDeNominationTransparenceV1;

export interface ContenuPropositionDeNominationTransparenceV2
  extends Omit<ContenuPropositionDeNominationTransparenceV1, 'version'> {
  version: 2;
  datePassageAuGrade: DateOnlyJson | null;
  datePriseDeFonctionPosteActuel: DateOnlyJson | null;
  informationCarrière: string | null;
}

type ContenuV2 = ContenuPropositionDeNominationTransparenceV2;

export const propositionDeNominationTransparenceContentV1Schema = z.object({
  version: z.undefined().optional(),
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
}) satisfies z.ZodType<ContenuV1>;

export const propositionDeNominationTransparenceContentV2Schema =
  propositionDeNominationTransparenceContentV1Schema.extend({
    version: z.literal(2),
    datePassageAuGrade: dateOnlyJsonSchema.nullable(),
    datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
    informationCarrière: z.string().nullable(),
  }) satisfies z.ZodType<ContenuV2>;

export class PropositionDeNominationTransparence extends DossierDeNomination<TypeDeSaisine.TRANSPARENCE_GDS> {
  updateFolderNumber(folderNumber: ContenuV2['folderNumber']) {
    this.updateContent({
      folderNumber,
    });
  }

  updateObservers(observers: ContenuV2['observers']) {
    this.updateContent({
      observers,
    });
  }

  updateDatePassageAuGrade(
    datePassageAuGrade: ContenuV2['datePassageAuGrade'],
  ) {
    this.updateContent({
      datePassageAuGrade,
    });
  }

  updateDatePriseDeFonctionPosteActuel(
    datePriseDeFonctionPosteActuel: ContenuV2['datePriseDeFonctionPosteActuel'],
  ) {
    this.updateContent({
      datePriseDeFonctionPosteActuel,
    });
  }

  updateInformationCarrière(
    informationCarrière: ContenuV2['informationCarrière'],
  ) {
    this.updateContent({
      informationCarrière,
    });
  }

  static fromDossierDeNomination(dossierDeNomination: DossierDeNomination) {
    const snapshot = dossierDeNomination.snapshot();

    const content = PropositionDeNominationTransparence.getSafeContent(
      snapshot.content,
    ) as ContenuV2;

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
