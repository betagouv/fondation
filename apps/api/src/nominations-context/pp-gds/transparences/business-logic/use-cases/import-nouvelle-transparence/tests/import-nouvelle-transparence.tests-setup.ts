import { Gender, Magistrat, Role, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-imported.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/transparence-tsv/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { ImportNouvelleTransparenceCommand } from '../Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../import-nouvelle-transparence.use-case';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { Avancement } from 'src/data-administration-context/lodam/business-logic/models/avancement';

export const aTransparencyName = Transparency.AUTOMNE_2024;
export const aTransparenceImportId = 'transparence-import-id';
export const aSessionId = aTransparencyName;
export const aFormation = Magistrat.Formation.PARQUET;
export const aDossierDeNominationId = 'dossier-de-nomination-id';
export const aDossierDeNominationImportedId =
  'dossier-de-nomination-imported-id';
export const anEventId = 'dossier-de-nomination-event-id';
export const aAffectationId = 'affectation-id';

export const lucLoïcReporterId = 'luc-loic-reporter-id';
export const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};

export const aDossierDeNominationPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: aDossierDeNominationImportedId,
    content: {
      transparency: aTransparencyName,
      biography: 'Nominee biography',
      birthDate: { day: 1, month: 1, year: 1980 },
      currentPosition: 'Current position',
      targettedPosition: 'Target position',
      dueDate: { day: 1, month: 6, year: 2023 },
      folderNumber: 1,
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.I,
      name: 'Nominee Name',
      observers: [],
      rank: 'A',
      reporterIds: [lucLoïcReporterId],
      rules: new NominationFileReadRulesBuilder().build(),

      avancement: Avancement.AVANCEMENT,
      datePassageAuGrade: { day: 1, month: 1, year: 2020 },
      datePriseDeFonctionPosteActuel: { day: 1, month: 1, year: 2021 },
      informationCarrière: 'Carrière',
    },
  };

export const aCommand = new ImportNouvelleTransparenceCommand(
  aTransparenceImportId,
  aTransparencyName,
  aFormation,
  [aDossierDeNominationPayload],
);

export const givenSomeUuids = (uuidGenerator: DeterministicUuidGenerator) => {
  uuidGenerator.nextUuids = [
    aSessionId,
    aDossierDeNominationId,
    anEventId,
    aAffectationId,
  ];
};

export const importNouvelleTransparenceUseCase = async (
  dependencies: ReturnType<typeof getDependencies>,
) => {
  await new ImportNouvelleTransparenceUseCase(
    dependencies.nullTransactionPerformer,
    dependencies.transparenceService,
  ).execute(aCommand);
};
