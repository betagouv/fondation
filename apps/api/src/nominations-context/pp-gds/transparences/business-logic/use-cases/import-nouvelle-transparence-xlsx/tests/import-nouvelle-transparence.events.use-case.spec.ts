import { TypeDeSaisine } from 'shared-models';
import { NouveauDossierDeNominationEvent } from 'src/nominations-context/sessions/business-logic/models/events/nouveau-dossier-de-nomination.event';
import {
  currentDate,
  getDependencies,
} from 'src/nominations-context/tests-dependencies';
import { ContenuPropositionDeNominationTransparenceV2 } from '../../../models/proposition-de-nomination';
import {
  aDateEchéance,
  aDossierDeNominationId,
  aDossierDeNominationPayload,
  anEventId,
  aSessionId,
  givenSomeUuids,
  importNouvelleTransparenceXlsxUseCase,
} from './import-nouvelle-transparence.tests-setup';

describe('Nouvelle transparence GDS - Events', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
  });

  it("publie un événement NouveauDossierDeNominationEvent lors de la création d'un dossier", async () => {
    await créerDossiersDeNomination();
    expectEventPublié();
  });

  async function créerDossiersDeNomination() {
    await importNouvelleTransparenceXlsxUseCase(dependencies);
  }

  function expectEventPublié() {
    const event = dependencies.domainEventRepository
      .events[0] as NouveauDossierDeNominationEvent<TypeDeSaisine.TRANSPARENCE_GDS>;
    expect(event).toBeInstanceOf(NouveauDossierDeNominationEvent);
    expect(event.id).toBe(anEventId);
    expect(event.occurredOn).toBe(currentDate);
    expect(event.payload.dossierDeNominationId).toBe(aDossierDeNominationId);
    expect(event.payload.sessionId).toBe(aSessionId);
    expect(
      event.payload.content,
    ).toEqual<ContenuPropositionDeNominationTransparenceV2>({
      version: 2,
      historique: aDossierDeNominationPayload.content.historique,
      dateDeNaissance: aDossierDeNominationPayload.content.dateDeNaissance,
      posteActuel: aDossierDeNominationPayload.content.posteActuel,
      posteCible: aDossierDeNominationPayload.content.posteCible,
      dateEchéance: aDateEchéance,
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
    });
  }
});
