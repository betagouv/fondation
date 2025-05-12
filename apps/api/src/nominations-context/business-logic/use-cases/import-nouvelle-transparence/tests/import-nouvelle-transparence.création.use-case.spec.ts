import { SessionSnapshot } from '../../../models/session';
import { TypeDeSaisine } from '../../../models/type-de-saisine';
import { getDependencies } from '../../../../tests-dependencies';
import {
  aFormation,
  aSessionId,
  aTransparenceImportId,
  aTransparencyName,
  givenSomeUuids,
  importNouvelleTransparenceUseCase,
} from './import-nouvelle-transparence.tests-setup';

describe('Nouvelle transparence GDS', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
  });

  it('crée une nouvelle transparence', async () => {
    await créerTransparence();
    expectTransparence();
  });

  async function créerTransparence() {
    await importNouvelleTransparenceUseCase(dependencies);
  }

  function expectTransparence() {
    expect(Object.values(dependencies.sessionRepository.sessions)).toEqual<
      SessionSnapshot[]
    >([
      {
        id: aSessionId,
        dataAdministrationImportId: aTransparenceImportId,
        name: aTransparencyName,
        formations: [aFormation],
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        version: 0,
      },
    ]);
  }
});
