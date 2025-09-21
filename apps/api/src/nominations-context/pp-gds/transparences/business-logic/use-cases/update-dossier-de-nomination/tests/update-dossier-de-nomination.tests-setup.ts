import {
  Magistrat,
  Month,
  NominationFile,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';
import { ContenuPropositionDeNominationTransparenceV1 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { GdsTransparenceNominationFilesModifiedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { UpdateDossierDeNominationUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';
import { getDependencies as getContextDependencies } from 'src/nominations-context/tests-dependencies';
import { UpdateDossierDeNominationCommand } from '../update-dossier-de-nomination.command';

export const existingDossierDeNominationId =
  'existing-dossier-de-nomination-id';
export const dossierDeNominationImportedId =
  'dossier-de-nomination-imported-id';

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

export const aDossierDeNomination: DossierDeNominationSnapshot<
  TypeDeSaisine.TRANSPARENCE_GDS,
  ContenuPropositionDeNominationTransparenceV1
> = {
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
    datePassageAuGrade: null,
    datePriseDeFonctionPosteActuel: null,
    informationCarrière: null,
  },
};

export const getDependencies = () => {
  const dependencies = getContextDependencies();

  const setupExistingDossierDeNomination = () => {
    dependencies.propropositionDeNominationTransparenceRepository.ajouterDossiers(
      aDossierDeNomination,
    );
  };

  const updateDossierDeNomination = async (
    command: UpdateDossierDeNominationCommand,
  ) => {
    await new UpdateDossierDeNominationUseCase(
      dependencies.nullTransactionPerformer,
      dependencies.propropositionDeNominationTransparenceRepository,
    ).execute(command);
  };

  function expectDossierWithNewObservers() {
    expectDossierWith({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        observers: ['observer-1', 'observer-2'],
      },
    });
  }

  function expectDossierWithNewFolderNumber() {
    expectDossierWith({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        folderNumber: 42,
      },
    });
  }

  function expectDossierWithDatePassageAuGrade() {
    const content: ContenuPropositionDeNominationTransparenceV1 = {
      ...aDossierDeNomination.content,
      datePassageAuGrade: { day: 15, month: 5 as Month, year: 2022 },
      datePriseDeFonctionPosteActuel: null,
      informationCarrière: null,
    };
    expectDossierWith({
      ...aDossierDeNomination,
      content,
    });
  }

  function expectDossierWithDatePriseDeFonctionPosteActuel() {
    const content: ContenuPropositionDeNominationTransparenceV1 = {
      ...aDossierDeNomination.content,
      datePassageAuGrade: null,
      datePriseDeFonctionPosteActuel: {
        day: 10,
        month: 3 as Month,
        year: 2021,
      },
      informationCarrière: null,
    };
    expectDossierWith({
      ...aDossierDeNomination,
      content,
    });
  }

  function expectDossierWithInformationCarrière() {
    const content: ContenuPropositionDeNominationTransparenceV1 = {
      ...aDossierDeNomination.content,
      datePassageAuGrade: null,
      datePriseDeFonctionPosteActuel: null,
      informationCarrière: "20 ans d'expérience dans la magistrature",
    };
    expectDossierWith({
      ...aDossierDeNomination,
      content,
    });
  }

  function expectDossierWith(
    dossierDeNomination: DossierDeNominationSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>,
  ) {
    const dossiers =
      dependencies.propropositionDeNominationTransparenceRepository.getDossiers();
    expect(dossiers).toHaveLength(1);
    expect(dossiers[0]).toEqual(dossierDeNomination);
  }

  return {
    setupExistingDossierDeNomination,
    updateDossierDeNomination,
    expectDossierWithNewObservers,
    expectDossierWithNewFolderNumber,
    expectDossierWithDatePassageAuGrade,
    expectDossierWithDatePriseDeFonctionPosteActuel,
    expectDossierWithInformationCarrière,
    expectDossierWith,
    aDossierDeNomination,
    aTransparencyId,
    aTransparencyName,
    initialRules,
    modifiedRules,
    nominationFileModificationWithObservers,
    nominationFileModificationWithFolderNumber,
    nominationFileModificationWithRules,
    nominationFileModificationWithDatePassageAuGrade,
    nominationFileModificationWithDatePriseDeFonctionPosteActuel,
    nominationFileModificationWithInformationCarriere,
    commandWithNewObservers,
    commandWithNewFolderNumber,
    commandWithModifiedRules,
    commandWithDatePassageAuGrade,
    commandWithDatePriseDeFonctionPosteActuel,
    commandWithInformationCarriere,
    ...dependencies,
  };
};
