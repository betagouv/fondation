import { Magistrat } from 'shared-models';
import { FakeTransparenceRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { TransparenceService } from 'src/nominations-context/business-logic/services/transparence.service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { SessionSnapshot } from '../../models/session';
import { TypeDeSaisine } from '../../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from './Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from './import-nouvelle-transparence.use-case';
import { FakePréAnalyseRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DomainRegistry } from '../../models/domain-registry';
import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';

describe('Nouvelle transparence GDS', () => {
  let transparenceRepository: FakeTransparenceRepository;
  let transparenceService: TransparenceService;
  let uuidGenerator: DeterministicUuidGenerator;

  beforeEach(() => {
    transparenceRepository = new FakeTransparenceRepository();
    transparenceService = new TransparenceService(
      new FakeDossierDeNominationRepository(),
      new FakePréAnalyseRepository(),
      transparenceRepository,
      new FakeAffectationRepository(),
    );

    uuidGenerator = new DeterministicUuidGenerator();
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  it('crée une nouvelle transparence', async () => {
    await créerTransparence();
    expectTransparence();
  });

  async function créerTransparence() {
    await new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      transparenceService,
    ).execute(aCommand);
  }

  function expectTransparence() {
    expect(Object.values(transparenceRepository.transparences)).toEqual<
      SessionSnapshot[]
    >([
      {
        id: aTransparencyName,
        name: aTransparencyName,
        formations: [aFormation],
        typeDeSaisine: aTypeDeSaisine,
      },
    ]);
  }
});

const aTransparencyName = 'transparence-name';
const aFormation = Magistrat.Formation.PARQUET;
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const aCommand = new ImportNouvelleTransparenceCommand(
  aTypeDeSaisine,
  aTransparencyName,
  [aFormation],
  [],
);
