import { Magistrat, TypeDeSaisine } from 'shared-models';
import { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination-content';
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
    ).toEqual<
      DossierDeNominationSnapshot<
        TypeDeSaisine.TRANSPARENCE_GDS,
        ContenuPropositionDeNominationTransparenceV2
      >[]
    >([
      {
        id: aDossierDeNominationId,
        nominationFileImportedId: aDossierDeNominationImportedId,
        sessionId: aParquetSessionId,
        content: {
          version: 2,
          historique: 'Nominee biography',
          dateDeNaissance: { day: 1, month: 1, year: 1980 },
          posteActuel: 'Current position',
          posteCible: 'Target position',
          dateEchéance: { day: 1, month: 6, year: 2023 },
          numeroDeDossier: 1,
          grade: Magistrat.Grade.I,
          nomMagistrat: 'Nominee Name',
          observants: [],
          rang: 'A',
          datePassageAuGrade: { day: 1, month: 1, year: 2020 },
          datePriseDeFonctionPosteActuel: { day: 1, month: 1, year: 2021 },
          informationCarrière: 'Carrière',
        },
      },
    ]);
  }
});
