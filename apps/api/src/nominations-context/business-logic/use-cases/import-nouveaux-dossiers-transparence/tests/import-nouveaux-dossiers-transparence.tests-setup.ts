import { Magistrat, Role, Transparency } from 'shared-models';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { FakeSessionRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-session.repository';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TypeDeSaisine } from '../../../models/type-de-saisine';
import { getDependencies } from '../../transparence.use-case.tests-dependencies';
import { ImportNouveauxDossiersTransparenceCommand } from '../import-nouveaux-dossiers-transparence.command';
import { ImportNouveauxDossiersTransparenceUseCase } from '../import-nouveaux-dossiers-transparence.use-case';

export const aTransparencyName = Transparency.AUTOMNE_2024;
export const aDossierDeNominationId = 'dossier-de-nomination-id';
const aDossierDeNominationImportedId = 'dossier-de-nomination-imported-id';
export const anEventId = 'event-id';
export const aSessionId = aTransparencyName;
export const aFormation = Magistrat.Formation.PARQUET;
export const aAffectationId = 'affectation-id';
export const aPréAnalyseId = 'préanalyse-id';

export const lucLoïcReporterId = 'luc-loic-reporter-id';
export const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
};

export const aDossierDeNominationPayload: GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'][number] =
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
    },
  };

const aCommand = new ImportNouveauxDossiersTransparenceCommand(
  aTransparencyName,
  [aDossierDeNominationPayload],
);

export const givenSomeUuids = (uuidGenerator: DeterministicUuidGenerator) => {
  uuidGenerator.nextUuids = [
    aDossierDeNominationId,
    anEventId,
    aPréAnalyseId,
    aAffectationId,
  ];
};
export const givenUneSession = (sessionRepository: FakeSessionRepository) => {
  sessionRepository.sessions = {
    [aTransparencyName]: {
      id: aTransparencyName,
      name: aTransparencyName,
      formations: [Magistrat.Formation.PARQUET],
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    },
  };
};

export const importNouveauxDossiersUseCase = async (
  dependencies: ReturnType<typeof getDependencies>,
) => {
  await new ImportNouveauxDossiersTransparenceUseCase(
    new NullTransactionPerformer(),
    dependencies.sessionRepository,
    dependencies.transparenceService,
  ).execute(aCommand);
};
