import {
  DateOnlyJson,
  Gender,
  Magistrat,
  Role,
  Transparency,
} from 'shared-models';
import { Avancement } from 'src/data-administration-context/lodam/business-logic/models/avancement';
import { TransparenceXlsxImportéeEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-importée.event';
import { ImportNouvelleTransparenceXlsxUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/import-nouvelle-transparence-xlsx/import-nouvelle-transparence-xlsx.use-case';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { ImportNouvelleTransparenceXlsxCommand } from '../Import-nouvelle-transparence-xlsx.command';

export const aTransparencyName = Transparency.AUTOMNE_2024;
export const aTransparenceImportId = 'transparence-import-id';
export const aDateEchéance: DateOnlyJson = { day: 1, month: 1, year: 2026 };
export const aDateTransparence: DateOnlyJson = { day: 1, month: 1, year: 2024 };
export const aDateClôtureDélaiObservation: DateOnlyJson | null = null;
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

export const aDossierDeNominationPayload: TransparenceXlsxImportéeEventPayload['nominationFiles'][number] =
  {
    nominationFileId: aDossierDeNominationImportedId,
    content: {
      historique: 'Nominee biography',
      dateDeNaissance: { day: 1, month: 1, year: 1980 },
      posteActuel: 'Current position',
      posteCible: 'Target position',
      numeroDeDossier: 1,
      grade: Magistrat.Grade.I,
      magistrat: 'Nominee Name',
      observers: [],
      rank: 'A',
      reporterIds: [lucLoïcReporterId],
      equivalenceOuAvancement: Avancement.AVANCEMENT,

      datePassageAuGrade: { day: 1, month: 1, year: 2020 },
      datePriseDeFonctionPosteActuel: { day: 1, month: 1, year: 2021 },
      informationCarriere: 'Carrière',
    },
  };

export const aCommand = new ImportNouvelleTransparenceXlsxCommand(
  aTransparenceImportId,
  aTransparencyName,
  aFormation,
  aDateEchéance,
  aDateTransparence,
  aDateClôtureDélaiObservation,
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

export const importNouvelleTransparenceXlsxUseCase = async (
  dependencies: ReturnType<typeof getDependencies>,
) => {
  await new ImportNouvelleTransparenceXlsxUseCase(
    dependencies.nullTransactionPerformer,
    dependencies.transparenceService,
  ).execute(aCommand);
};
