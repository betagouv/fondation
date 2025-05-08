import { Magistrat } from 'shared-models';
import { DossierDeNominationSnapshot } from '../../../models/dossier-de-nomination';
import { getDependencies } from '../../../../tests-dependencies';
import {
  aDossierDeNominationId,
  aDossierDeNominationImportedId,
  aTransparencyName,
  givenSomeUuids,
  importNouvelleTransparenceUseCase,
} from './import-nouvelle-transparence.tests-setup';

describe('Nouvelle transparence GDS - Dossiers de nominations', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
  });

  it('crée un dossier de nomination', async () => {
    await créerDossiersDeNomination();
    expectDossierDeNominationCréé();
  });

  async function créerDossiersDeNomination() {
    await importNouvelleTransparenceUseCase(dependencies);
  }

  function expectDossierDeNominationCréé() {
    expect(dependencies.dossierDeNominationRepository.getDossiers()).toEqual<
      DossierDeNominationSnapshot[]
    >([
      {
        id: aDossierDeNominationId,
        nominationFileImportedId: aDossierDeNominationImportedId,
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
