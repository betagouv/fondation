import { getDependencies } from 'src/nominations-context/tests-dependencies';

import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import {
  aDossierDeNominationId,
  aDossierDeNominationImportedId,
  aDossierDeNominationPayload,
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
    expect(
      dependencies.propropositionDeNominationTransparenceRepository.getDossiers(),
    ).toEqual<DossierDeNominationSnapshot[]>([
      {
        id: aDossierDeNominationId,
        nominationFileImportedId: aDossierDeNominationImportedId,
        sessionId: aTransparencyName,
        content: {
          formation: null,
          biography: aDossierDeNominationPayload.content.biography,
          birthDate: aDossierDeNominationPayload.content.birthDate,
          currentPosition: aDossierDeNominationPayload.content.currentPosition,
          targetedPosition:
            aDossierDeNominationPayload.content.targettedPosition,
          dueDate: aDossierDeNominationPayload.content.dueDate!,
          folderNumber: aDossierDeNominationPayload.content.folderNumber,
          grade: aDossierDeNominationPayload.content.grade,
          name: aDossierDeNominationPayload.content.name,
          observers: aDossierDeNominationPayload.content.observers ?? [],
          rank: aDossierDeNominationPayload.content.rank,
          lastRankingDate:
            aDossierDeNominationPayload.content.datePassageAuGrade,
          lastPositionDate:
            aDossierDeNominationPayload.content.datePriseDeFonctionPosteActuel,
        },
      },
    ]);
  }
});
