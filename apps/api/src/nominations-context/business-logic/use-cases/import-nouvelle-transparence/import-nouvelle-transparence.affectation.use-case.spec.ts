import { Magistrat, Role, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakePréAnalyseRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeTransparenceRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { FakeUserService } from 'src/nominations-context/adapters/secondary/services/fake-user.service';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { AffectationSnapshot } from '../../models/affectation';
import { DomainRegistry } from '../../models/domain-registry';
import { TypeDeSaisine } from '../../models/type-de-saisine';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNouvelleTransparenceCommand } from './Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from './import-nouvelle-transparence.use-case';

describe('Affectation des rapporteurs de transparence au format tsv', () => {
  let affectationRepository: FakeAffectationRepository;
  let userService: FakeUserService;
  let transparenceRepository: FakeTransparenceRepository;
  let dossierDeNominationRepository: FakeDossierDeNominationRepository;
  let transparenceService: TransparenceService;
  let uuidGenerator: DeterministicUuidGenerator;

  beforeEach(() => {
    affectationRepository = new FakeAffectationRepository();
    transparenceRepository = new FakeTransparenceRepository();
    dossierDeNominationRepository = new FakeDossierDeNominationRepository();
    transparenceService = new TransparenceService(
      dossierDeNominationRepository,
      new FakePréAnalyseRepository(),
      transparenceRepository,
      affectationRepository,
    );
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aDossierDeNominationId];
    DomainRegistry.setUuidGenerator(uuidGenerator);

    userService = new FakeUserService();
    userService.addUsers(lucLoïcUser);
  });

  it('crée une affectation des rapporteurs aux dossiers de nominations', async () => {
    await créerAffectationRapporteurs();
    expectAffectationRapporteursCréée();
  });

  const créerAffectationRapporteurs = () =>
    new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      transparenceService,
    ).execute(aCommand);

  const expectAffectationRapporteursCréée = () =>
    expect(affectationRepository.getAffectations()).toEqual<
      AffectationSnapshot[]
    >([
      {
        transparenceId: aTransparencyName,
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
