import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { ContenuPropositionDeNominationTransparenceV2 } from '../../../models/proposition-de-nomination';
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
          biography: aDossierDeNominationPayload.content.biography,
          birthDate: aDossierDeNominationPayload.content.birthDate,
          currentPosition: aDossierDeNominationPayload.content.currentPosition,
          targettedPosition:
            aDossierDeNominationPayload.content.targettedPosition,
          dueDate: aDossierDeNominationPayload.content.dueDate,
          folderNumber: aDossierDeNominationPayload.content.folderNumber,
          formation: aDossierDeNominationPayload.content.formation,
          grade: aDossierDeNominationPayload.content.grade,
          name: aDossierDeNominationPayload.content.name,
          observers: aDossierDeNominationPayload.content.observers,
          rank: aDossierDeNominationPayload.content.rank,
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
