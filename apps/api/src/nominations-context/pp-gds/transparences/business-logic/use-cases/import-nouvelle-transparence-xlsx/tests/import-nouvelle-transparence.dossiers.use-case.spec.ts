import { getDependencies } from 'src/nominations-context/tests-dependencies';

import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import {
  aDateEchéance,
  aDossierDeNominationId,
  aDossierDeNominationImportedId,
  aDossierDeNominationPayload,
  aTransparencyName,
  givenSomeUuids,
  importNouvelleTransparenceXlsxUseCase,
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
    await importNouvelleTransparenceXlsxUseCase(dependencies);
  }

  function expectDossierDeNominationCréé() {
    expect(
      dependencies.propropositionDeNominationTransparenceRepository.getDossiers(),
    ).toEqual<DossierDeNominationSnapshot[]>([
      {
        id: aDossierDeNominationId,
        nominationFileImportedId: aDossierDeNominationImportedId,
        sessionId: aTransparencyName,
        content: {
          biography: aDossierDeNominationPayload.content.historique,
          birthDate: aDossierDeNominationPayload.content.dateDeNaissance,
          currentPosition: aDossierDeNominationPayload.content.posteActuel,
          targetedPosition: aDossierDeNominationPayload.content.posteCible,
          folderNumber: aDossierDeNominationPayload.content.numeroDeDossier,
          grade: aDossierDeNominationPayload.content.grade,
          name: aDossierDeNominationPayload.content.magistrat,
          observers: aDossierDeNominationPayload.content.observers ?? [],
          rank: aDossierDeNominationPayload.content.rank,
          lastRankingDate:
            aDossierDeNominationPayload.content.datePassageAuGrade,
          lastPositionDate:
            aDossierDeNominationPayload.content.datePriseDeFonctionPosteActuel,
          dueDate: aDateEchéance,
          formation: null,
        },
      },
    ]);
  }
});
