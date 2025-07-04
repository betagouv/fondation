import { TypeDeSaisine } from 'shared-models';
import {
  aDateClôtureDélaiObservation,
  aDateTransparence,
  aFormation,
  aSessionId,
  aTransparenceImportId,
  aTransparencyName,
  givenSomeUuids,
  importNouvelleTransparenceXlsxUseCase,
} from './import-nouvelle-transparence.tests-setup';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { SessionSnapshot } from 'src/nominations-context/sessions/business-logic/models/session';

describe('Nouvelle transparence', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
  });

  it('crée une nouvelle transparence', async () => {
    await créerTransparence();
    expectTransparence();
  });

  const créerTransparence = () =>
    importNouvelleTransparenceXlsxUseCase(dependencies);

  const expectTransparence = () => {
    expect(Object.values(dependencies.sessionRepository.fakeSessions)).toEqual<
      SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>[]
    >([
      {
        id: aSessionId,
        sessionImportéeId: aTransparenceImportId,
        name: aTransparencyName,
        formation: aFormation,
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        version: 0,
        content: {
          dateTransparence: aDateTransparence,
          dateClôtureDélaiObservation: aDateClôtureDélaiObservation,
        },
      },
    ]);
  };
});
