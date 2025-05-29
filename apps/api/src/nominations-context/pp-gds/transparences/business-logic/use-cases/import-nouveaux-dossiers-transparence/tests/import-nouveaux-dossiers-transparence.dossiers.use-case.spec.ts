import { Magistrat } from 'shared-models';
import {
  aDossierDeNominationId,
  aDossierDeNominationImportedId,
  aParquetSessionId,
  givenSomeUuids,
  givenUneSession,
  importNouveauxDossiersUseCase,
} from './import-nouveaux-dossiers-transparence.tests-setup';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { ContenuPropositionDeNominationTransparenceV2 } from '../../../models/proposition-de-nomination';

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
      DossierDeNominationSnapshot<
        unknown,
        ContenuPropositionDeNominationTransparenceV2
      >[]
    >([
      {
        id: aDossierDeNominationId,
        nominationFileImportedId: aDossierDeNominationImportedId,
        sessionId: aParquetSessionId,
        content: {
          version: 2,
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
          datePassageAuGrade: { day: 1, month: 1, year: 2020 },
          datePriseDeFonctionPosteActuel: { day: 1, month: 1, year: 2021 },
          informationCarrière: 'Carrière',
        },
      },
    ]);
  }
});
