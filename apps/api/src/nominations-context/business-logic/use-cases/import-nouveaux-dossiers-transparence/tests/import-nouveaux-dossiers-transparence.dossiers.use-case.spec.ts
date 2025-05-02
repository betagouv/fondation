import { Magistrat } from 'shared-models';
import { DossierDeNominationSnapshot } from '../../../models/dossier-de-nomination';
import { getDependencies } from '../../transparence.use-case.tests-dependencies';
import {
  aDossierDeNominationId,
  aTransparencyName,
  importNouveauxDossiersUseCase,
  givenUneSession,
  givenSomeUuids,
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
