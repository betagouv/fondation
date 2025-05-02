import {
  allRulesMapV2,
  Magistrat,
  NominationFile,
  RulesBuilder,
  Transparency,
} from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { PréAnalyseSnapshot } from '../../../models/pré-analyse';
import { TypeDeSaisine } from '../../../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from '../Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../import-nouvelle-transparence.use-case';
import { getDependencies } from '../../transparence.use-case.tests-dependencies';

describe('Nouvelle transparence GDS - Pré-analyse', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.uuidGenerator.nextUuids = [
      aDossierDeNominationId,
      'dossier-de-nomination-event-id',
      aPréAnalyseId,
    ];
  });

  it("crée la pré-analyse d'un dossier de nomination", async () => {
    await créerDossiersDeNomination();
    expectPréAnalyseCréée();
  });

  async function créerDossiersDeNomination() {
    await new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      dependencies.transparenceService,
    ).execute(aCommand);
  }

  function expectPréAnalyseCréée() {
    const préAnalyses = dependencies.préAnalyseRepository.getPréAnalyses();
    expect(préAnalyses.map(sortPréAnalyse)).toEqual<PréAnalyseSnapshot[]>([
      préAnalyseSnapshot,
    ]);
  }
});

const aTransparencyName = Transparency.AUTOMNE_2024;
const aFormation = Magistrat.Formation.PARQUET;
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const aDossierDeNominationId = 'dossier-de-nomination-id';

const aDossierDeNominationPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'][number] =
  {
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
    reporterIds: ['reporter-1'],
    rules: new NominationFileReadRulesBuilder().build(),
  };

const aCommand = new ImportNouvelleTransparenceCommand(
  aTypeDeSaisine,
  aTransparencyName,
  [aFormation],
  [aDossierDeNominationPayload],
);

class PréAnalyseRules extends RulesBuilder<{
  group: string;
  name: string;
  value: boolean;
}> {
  constructor() {
    super(
      ({ ruleGroup, ruleName }) => ({
        group: ruleGroup,
        name: ruleName,
        value: [
          NominationFile.StatutoryRule
            .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS,
          NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS,
        ].includes(ruleName as NominationFile.StatutoryRule)
          ? // Nouvelles règles pré-validées à false par défaut
            false
          : true,
      }),
      allRulesMapV2,
    );
  }
}

const sortPréAnalyse = (préAnalyse: PréAnalyseSnapshot) => ({
  ...préAnalyse,
  règles: préAnalyse.règles.sort((a, b) => a.name.localeCompare(b.name)),
});

const aPréAnalyseId = 'préanalyse-id';
const préAnalyseRules = new PréAnalyseRules().build();
const préAnalyseSnapshot: PréAnalyseSnapshot = sortPréAnalyse({
  dossierDeNominationId: aDossierDeNominationId,
  id: aPréAnalyseId,
  règles: Object.values(préAnalyseRules)
    .map((rule) => Object.values(rule))
    .flat(),
});
