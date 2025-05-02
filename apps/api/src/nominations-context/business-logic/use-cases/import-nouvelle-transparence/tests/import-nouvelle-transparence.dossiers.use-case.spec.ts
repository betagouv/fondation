import { Magistrat, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { DossierDeNominationSnapshot } from '../../../models/dossier-de-nomination';
import { TypeDeSaisine } from '../../../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from '../Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../import-nouvelle-transparence.use-case';
import { getDependencies } from '../../transparence.use-case.tests-dependencies';

describe('Nouvelle transparence GDS - Dossiers de nominations', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.uuidGenerator.nextUuids = [aDossierDeNominationId];
  });

  it('crée un dossier de nomination', async () => {
    await créerDossiersDeNomination();
    expectDossierDeNominationCréé();
  });

  async function créerDossiersDeNomination() {
    await new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      dependencies.transparenceService,
    ).execute(aCommand);
  }

  function expectDossierDeNominationCréé() {
    expect(dependencies.dossierDeNominationRepository.getDossiers()).toEqual<
      DossierDeNominationSnapshot[]
    >([
      {
        id: aDossierDeNominationId,
        sessionId: aTransparencyName,
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
      },
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
