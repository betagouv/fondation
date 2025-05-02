import { Magistrat } from 'shared-models';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { SessionSnapshot } from '../../../models/session';
import { TypeDeSaisine } from '../../../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from '../Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../import-nouvelle-transparence.use-case';
import { getDependencies } from '../../transparence.use-case.tests-dependencies';

describe('Nouvelle transparence GDS', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
  });

  it('crée une nouvelle transparence', async () => {
    await créerTransparence();
    expectTransparence();
  });

  async function créerTransparence() {
    await new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      dependencies.transparenceService,
    ).execute(aCommand);
  }

  function expectTransparence() {
    expect(Object.values(dependencies.sessionRepository.sessions)).toEqual<
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
