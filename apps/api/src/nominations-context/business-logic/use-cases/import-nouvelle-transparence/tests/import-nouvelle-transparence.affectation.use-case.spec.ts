import { Magistrat, Role, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { AffectationSnapshot } from '../../../models/affectation';
import { TypeDeSaisine } from '../../../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from '../Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../import-nouvelle-transparence.use-case';
import { getDependencies } from '../../transparence.use-case.tests-dependencies';

describe('Affectation des rapporteurs de transparence au format tsv', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.uuidGenerator.nextUuids = [
      aDossierDeNominationId,
      'pré-analyse-id',
      'dossier-de-nomination-event-id',
      aAffectationId,
    ];
    dependencies.userService.addUsers(lucLoïcUser);
  });

  it('crée une affectation des rapporteurs aux dossiers de nominations', async () => {
    await créerAffectationRapporteurs();
    expectAffectationRapporteursCréée();
  });

  const créerAffectationRapporteurs = () =>
    new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      dependencies.transparenceService,
    ).execute(aCommand);

  const expectAffectationRapporteursCréée = () =>
    expect(dependencies.affectationRepository.getAffectations()).toEqual<
      AffectationSnapshot[]
    >([
      {
        id: aAffectationId,
        sessionId: aTransparencyName,
        formation: aFormation,
        affectationsDossiersDeNominations: [
          {
            dossierDeNominationId: aDossierDeNominationId,
            rapporteurIds: [lucLoïcReporterId],
          },
        ],
      },
    ]);
});

const lucLoïcReporterId = 'luc-loic-reporter-id';
const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
};

const aTransparencyName = Transparency.AUTOMNE_2024;
const aFormation = Magistrat.Formation.PARQUET;
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const aDossierDeNominationId = 'dossier-de-nomination-id';
const aAffectationId = 'affectation-id';

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
    reporterIds: [lucLoïcReporterId],
    rules: new NominationFileReadRulesBuilder().build(),
  };

const aCommand = new ImportNouvelleTransparenceCommand(
  aTypeDeSaisine,
  aTransparencyName,
  [aFormation],
  [aDossierDeNominationPayload],
);
