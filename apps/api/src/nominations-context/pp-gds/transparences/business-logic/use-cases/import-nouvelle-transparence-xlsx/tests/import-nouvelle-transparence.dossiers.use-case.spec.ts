import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { ContenuPropositionDeNominationTransparenceV2 } from '../../../models/proposition-de-nomination';
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
          historique: aDossierDeNominationPayload.content.historique,
          dateDeNaissance: aDossierDeNominationPayload.content.dateDeNaissance,
          posteActuel: aDossierDeNominationPayload.content.posteActuel,
          posteCible: aDossierDeNominationPayload.content.posteCible,
          numeroDeDossier: aDossierDeNominationPayload.content.numeroDeDossier,
          grade: aDossierDeNominationPayload.content.grade,
          nomMagistrat: aDossierDeNominationPayload.content.magistrat,
          observants: aDossierDeNominationPayload.content.observers,
          rang: aDossierDeNominationPayload.content.rank,
          datePassageAuGrade:
            aDossierDeNominationPayload.content.datePassageAuGrade,
          datePriseDeFonctionPosteActuel:
            aDossierDeNominationPayload.content.datePriseDeFonctionPosteActuel,
          informationCarrière:
            aDossierDeNominationPayload.content.informationCarriere,
          dateEchéance: aDateEchéance,
        },
      },
    ]);
  }
});
