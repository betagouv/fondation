import { Magistrat } from 'shared-models';
import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import {
  aDossierDeNominationId,
  aDossierDeNominationImportedId,
  aParquetSessionId,
  givenSomeUuids,
  givenUneSession,
  importNouveauxDossiersUseCase,
} from './import-nouveaux-dossiers-transparence.tests-setup';

describe('Import nouveaux dossiers dans une transparence - Dossiers de nominations', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
    givenUneSession(dependencies.sessionRepository);
  });

  it('crée un dossier de nomination pour une transparence existante', async () => {
    await créerNouveauxDossiers();
    expectDossierDeNominationCréé();
  });

  async function créerNouveauxDossiers() {
    await importNouveauxDossiersUseCase(dependencies);
  }

  function expectDossierDeNominationCréé() {
    expect(
      dependencies.propropositionDeNominationTransparenceRepository.getDossiers(),
    ).toEqual<DossierDeNominationSnapshot[]>([
      {
        id: aDossierDeNominationId,
        nominationFileImportedId: aDossierDeNominationImportedId,
        sessionId: aParquetSessionId,
        content: {
          biography: 'Nominee biography',
          birthDate: { day: 1, month: 1, year: 1980 },
          currentPosition: 'Current position',
          targetedPosition: 'Target position',
          dueDate: { day: 1, month: 6, year: 2023 },
          folderNumber: 1,
          grade: Magistrat.Grade.I,
          name: 'Nominee Name',
          observers: [],
          rank: 'A',
          lastRankingDate: { day: 1, month: 1, year: 2020 },
          lastPositionDate: { day: 1, month: 1, year: 2021 },
          formation: null,
        },
      },
    ]);
  }
});
