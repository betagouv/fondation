import { Magistrat } from 'shared-models';
import { FakeTransparenceRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-transparence.repository';
import {
  ImportNouvelleTransparenceCommand,
  ImportNouvelleTransparenceUseCase,
} from './import-nouvelle-transparence.use-case';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TypeDeSaisine } from '../../models/type-de-saisine';
import { TransparenceSnapshot } from '../../models/transparence';
import { DomainRegistry } from '../../models/domain-registry';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';

describe('Nouvelle transparence GDS', () => {
  let transparenceRepository: FakeTransparenceRepository;

  beforeEach(() => {
    transparenceRepository = new FakeTransparenceRepository();
    const uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aTransparenceId];
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  it('crée une nouvelle transparence', async () => {
    await créerTransparence();
    expectTransparence();
  });

  async function créerTransparence() {
    await new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      transparenceRepository,
    ).execute(aCommand);
  }

  function expectTransparence() {
    expect(Object.values(transparenceRepository.transparences)).toEqual<
      TransparenceSnapshot[]
    >([
      {
        id: aTransparenceId,
        name: aTransparencyName,
        formations: [aFormation],
        typeDeSaisine: aTypeDeSaisine,
      },
    ]);
  }
});

const aTransparenceId = 'transparence-id';
const aTransparencyName = 'transparence-name';
const aFormation = Magistrat.Formation.PARQUET;
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const aCommand = new ImportNouvelleTransparenceCommand(
  aTypeDeSaisine,
  aTransparencyName,
  [aFormation],
);
