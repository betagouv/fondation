import { getDependencies } from 'src/nominations-context/tests-dependencies';

import { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination-content';
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
    ).toEqual<
      DossierDeNominationSnapshot<
        unknown,
        ContenuPropositionDeNominationTransparenceV2
      >[]
    >([
      {
        id: aDossierDeNominationId,
        nominationFileImportedId: aDossierDeNominationImportedId,
        sessionId: aTransparencyName,
        content: {
          version: 2,
          historique: aDossierDeNominationPayload.content.biography,
          dateDeNaissance: aDossierDeNominationPayload.content.birthDate,
          posteActuel: aDossierDeNominationPayload.content.currentPosition,
          posteCible: aDossierDeNominationPayload.content.targettedPosition,
          dateEchéance: aDossierDeNominationPayload.content.dueDate!,
          numeroDeDossier: aDossierDeNominationPayload.content.folderNumber,
          grade: aDossierDeNominationPayload.content.grade,
          nomMagistrat: aDossierDeNominationPayload.content.name,
          observants: aDossierDeNominationPayload.content.observers,
          rang: aDossierDeNominationPayload.content.rank,
          datePassageAuGrade:
            aDossierDeNominationPayload.content.datePassageAuGrade,
          datePriseDeFonctionPosteActuel:
            aDossierDeNominationPayload.content.datePriseDeFonctionPosteActuel,
          informationCarrière:
            aDossierDeNominationPayload.content.informationCarrière,
        },
      },
    ]);
  }
});
