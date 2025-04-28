import { Magistrat, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakePréAnalyseRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeTransparenceRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { TransparenceService } from 'src/nominations-context/business-logic/services/transparence.service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TypeDeSaisine } from '../../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from './Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from './import-nouvelle-transparence.use-case';
import { DossierDeNominationSnapshot } from '../../models/dossier-de-nomination';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';

describe('Nouvelle transparence GDS - Dossiers de nominations', () => {
  let transparenceRepository: FakeTransparenceRepository;
  let dossierDeNominationRepository: FakeDossierDeNominationRepository;
  let transparenceService: TransparenceService;
  let uuidGenerator: DeterministicUuidGenerator;

  beforeEach(() => {
    transparenceRepository = new FakeTransparenceRepository();
    dossierDeNominationRepository = new FakeDossierDeNominationRepository();
    transparenceService = new TransparenceService(
      dossierDeNominationRepository,
      new FakePréAnalyseRepository(),
      transparenceRepository,
      new FakeAffectationRepository(),
    );
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aDossierDeNominationId];
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  it('crée un dossier de nomination', async () => {
    await créerDossiersDeNomination();
    expectDossierDeNominationCréé();
  });

  async function créerDossiersDeNomination() {
    await new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      transparenceService,
    ).execute(aCommand);
  }

  function expectDossierDeNominationCréé() {
    expect(dossierDeNominationRepository.getDossiers()).toEqual<
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
