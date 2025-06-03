import {
  Magistrat,
  NominationFile,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';
import { GdsTransparenceNominationFilesModifiedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { UpdateDossierDeNominationCommand } from '../update-dossier-de-nomination.command';

export const existingDossierDeNominationId =
  'existing-dossier-de-nomination-id';
export const dossierDeNominationImportedId =
  'dossier-de-nomination-imported-id';
export const existingPréAnalyseId = 'existing-préanalyse-id';

export const aTransparencyName = Transparency.AUTOMNE_2024;
export const aTransparencyId = 'transparency-id';

export const initialRules = [
  {
    group: 'statutory',
    name: NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS,
    value: false,
  },
  {
    group: 'statutory',
    name: NominationFile.StatutoryRule
      .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS,
    value: false,
  },
];

export const modifiedRules = {
  [NominationFile.RuleGroup.STATUTORY]: {
    [NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS]: true,
  },
};

export const nominationFileModificationWithObservers: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: dossierDeNominationImportedId,
    content: {
      observers: ['observer-1', 'observer-2'],
    },
  };

export const nominationFileModificationWithFolderNumber: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: dossierDeNominationImportedId,
    content: {
      folderNumber: 42,
    },
  };

export const nominationFileModificationWithRules: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: dossierDeNominationImportedId,
    content: {
      rules: modifiedRules,
    },
  };

export const nominationFileModificationWithDatePassageAuGrade: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: dossierDeNominationImportedId,
    content: {
      datePassageAuGrade: { day: 15, month: 5, year: 2022 },
    },
  };

export const nominationFileModificationWithDatePriseDeFonctionPosteActuel: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: dossierDeNominationImportedId,
    content: {
      datePriseDeFonctionPosteActuel: { day: 10, month: 3, year: 2021 },
    },
  };

export const nominationFileModificationWithInformationCarriere: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: dossierDeNominationImportedId,
    content: {
      informationCarrière: "20 ans d'expérience dans la magistrature",
    },
  };

export const commandWithNewObservers = new UpdateDossierDeNominationCommand(
  aTransparencyId,
  aTransparencyName,
  [nominationFileModificationWithObservers],
);

export const commandWithNewFolderNumber = new UpdateDossierDeNominationCommand(
  aTransparencyId,
  aTransparencyName,
  [nominationFileModificationWithFolderNumber],
);

export const commandWithModifiedRules = new UpdateDossierDeNominationCommand(
  aTransparencyId,
  aTransparencyName,
  [nominationFileModificationWithRules],
);

export const commandWithDatePassageAuGrade =
  new UpdateDossierDeNominationCommand(aTransparencyId, aTransparencyName, [
    nominationFileModificationWithDatePassageAuGrade,
  ]);

export const commandWithDatePriseDeFonctionPosteActuel =
  new UpdateDossierDeNominationCommand(aTransparencyId, aTransparencyName, [
    nominationFileModificationWithDatePriseDeFonctionPosteActuel,
  ]);

export const commandWithInformationCarriere =
  new UpdateDossierDeNominationCommand(aTransparencyId, aTransparencyName, [
    nominationFileModificationWithInformationCarriere,
  ]);

export const aDossierDeNomination: DossierDeNominationSnapshot<TypeDeSaisine.TRANSPARENCE_GDS> =
  {
    id: existingDossierDeNominationId,
    nominationFileImportedId: dossierDeNominationImportedId,
    sessionId: aTransparencyName,
    content: {
      folderNumber: 1,
      observers: [],
      biography: 'Nominee biography',
      birthDate: { day: 1, month: 1, year: 1980 },
      currentPosition: 'Current position',
      targettedPosition: 'Target position',
      dueDate: { day: 1, month: 6, year: 2023 },
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.I,
      name: 'Nominee Name',
      rank: 'A',
      version: 2,
      datePassageAuGrade: { day: 15, month: 5, year: 2022 },
      datePriseDeFonctionPosteActuel: { day: 10, month: 3, year: 2021 },
      informationCarrière: "20 ans d'expérience dans la magistrature",
    },
  };
