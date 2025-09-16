import {
  DateOnlyJson,
  Gender,
  Magistrat,
  Role,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';
import { Avancement } from 'src/data-administration-context/lodam/business-logic/models/avancement';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/transparence-tsv/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';

import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination-content';
import { FakeAffectationRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakeSessionRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/fake-session.repository';
import { AffectationSnapshot } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { ImportNouveauxDossiersTransparenceCommand } from '../import-nouveaux-dossiers-transparence.command';
import { ImportNouveauxDossiersTransparenceUseCase } from '../import-nouveaux-dossiers-transparence.use-case';

export const aTransparencyName = Transparency.AUTOMNE_2024;
export const aDateEchéance: DateOnlyJson = { day: 1, month: 6, year: 2023 };
export const aParquetTransparenceImportId = 'transparence-import-id';
export const aSiègeTransparenceImportId = 'siège-transparence-import-id';
export const aDossierDeNominationId = 'dossier-de-nomination-id';
export const aDossierDeNominationImportedId =
  'dossier-de-nomination-imported-id';
export const anEventId = 'event-id';
export const aParquetSessionId = 'a-session-id';
export const aSiègeSessionId = 'siège-session-id';
export const aFormation = Magistrat.Formation.PARQUET;
export const aAffectationId = 'affectation-id';
export const aSecondSiègeDossierId = 'second-siege-dossier-id';

export const julesReporterId = 'jules-reporter-id';
export const lucLoïcReporterId = 'luc-loic-reporter-id';
export const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};

export const aDossierDeNominationPayload: GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: aDossierDeNominationImportedId,
    content: {
      transparency: aTransparencyName,
      formation: aFormation,
      reporterIds: [lucLoïcReporterId],
      biography: 'Nominee biography',
      birthDate: { day: 1, month: 1, year: 1980 },
      currentPosition: 'Current position',
      targettedPosition: 'Target position',
      dueDate: { day: 1, month: 6, year: 2023 },
      folderNumber: 1,
      grade: Magistrat.Grade.I,
      name: 'Nominee Name',
      observers: [],
      rank: 'A',
      rules: new NominationFileReadRulesBuilder().build(),

      avancement: Avancement.AVANCEMENT,
      datePassageAuGrade: { day: 1, month: 1, year: 2020 },
      datePriseDeFonctionPosteActuel: { day: 1, month: 1, year: 2021 },
      informationCarrière: 'Carrière',
    },
  };

export const aParquetCommand = new ImportNouveauxDossiersTransparenceCommand(
  aParquetTransparenceImportId,
  [aDossierDeNominationPayload],
);
export const aSiègeCommand = new ImportNouveauxDossiersTransparenceCommand(
  aSiègeTransparenceImportId,
  [
    {
      nominationFileId: 'siege-dossier-imported-id',
      content: {
        ...aDossierDeNominationPayload.content,
        formation: Magistrat.Formation.SIEGE,
      },
    },
  ],
);

export const aSecondSiègeCommand =
  new ImportNouveauxDossiersTransparenceCommand(aSiègeTransparenceImportId, [
    {
      nominationFileId: 'second-siege-dossier-imported-id',
      content: {
        ...aDossierDeNominationPayload.content,
        formation: Magistrat.Formation.SIEGE,
        reporterIds: [julesReporterId],
      },
    },
  ]);

export const givenSomeUuids = (uuidGenerator: DeterministicUuidGenerator) => {
  uuidGenerator.nextUuids = [aDossierDeNominationId, anEventId, aAffectationId];
};
export const givenUneSession = (sessionRepository: FakeSessionRepository) => {
  sessionRepository.fakeSessions = {
    [aParquetSessionId]: {
      id: aParquetSessionId,
      name: aTransparencyName,
      sessionImportéeId: aParquetTransparenceImportId,
      version: 0,
      formation: aFormation,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
      content: {},
    },
  };
};

export const givenUneSessionSiège = (
  sessionRepository: FakeSessionRepository,
) => {
  sessionRepository.fakeSessions = {
    [aSiègeSessionId]: {
      id: aSiègeSessionId,
      name: aTransparencyName,
      sessionImportéeId: aSiègeTransparenceImportId,
      version: 0,
      formation: Magistrat.Formation.SIEGE,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
      content: {},
    },
  };
};

export const unDossierSiège = {
  id: 'siege-dossier-id',
  sessionId: aSiègeSessionId,
  nominationFileImportedId: 'siege-dossier-imported-id',
  content: {
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
  },
} satisfies DossierDeNominationSnapshot;
export const givenUnDossierDuSiège = (
  dossierDeNominationRepository: FakeDossierDeNominationRepository,
) => dossierDeNominationRepository.ajouterDossiers(unDossierSiège);

export const uneAffectationParquet: AffectationSnapshot = {
  id: aAffectationId,
  sessionId: aParquetSessionId,
  formation: aFormation,
  affectationsDossiersDeNominations: [
    {
      dossierDeNominationId: aDossierDeNominationId,
      rapporteurIds: [lucLoïcReporterId],
    },
  ],
};

export const uneAffectionSiège = {
  id: 'affectation-siège-id',
  sessionId: aSiègeSessionId,
  formation: Magistrat.Formation.SIEGE,
  affectationsDossiersDeNominations: [
    {
      dossierDeNominationId: unDossierSiège.id,
      rapporteurIds: [lucLoïcReporterId],
    },
  ],
} satisfies AffectationSnapshot;

export const uneAffectationSiègeAvecDeuxDossiers = {
  id: 'affectation-siège-id',
  sessionId: aSiègeSessionId,
  formation: Magistrat.Formation.SIEGE,
  affectationsDossiersDeNominations: [
    {
      dossierDeNominationId: unDossierSiège.id,
      rapporteurIds: [lucLoïcReporterId],
    },
    {
      dossierDeNominationId: aDossierDeNominationId,
      rapporteurIds: [julesReporterId],
    },
  ],
} satisfies AffectationSnapshot;

export const givenUneAffectationSiège = (
  affectationRepository: FakeAffectationRepository,
) => affectationRepository.addAffectations(uneAffectionSiège);

export const importNouveauxDossiersUseCase = async (
  dependencies: ReturnType<typeof getDependencies>,
  command: ImportNouveauxDossiersTransparenceCommand = aParquetCommand,
) => {
  await new ImportNouveauxDossiersTransparenceUseCase(
    dependencies.nullTransactionPerformer,
    dependencies.sessionRepository,
    dependencies.transparenceService,
  ).execute(command);
};
