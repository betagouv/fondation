import { TypeDeSaisine } from 'shared-models';
import { NouveauDossierDeNominationEvent } from 'src/nominations-context/dossier-de-nominations/business-logic/models/events/nouveau-dossier-de-nomination.event';
import {
  currentDate,
  getDependencies,
} from 'src/nominations-context/tests-dependencies';

import {
  aDateEchéance,
  aDossierDeNominationId,
  aDossierDeNominationPayload,
  anEventId,
  aSessionId,
  givenSomeUuids,
  importNouvelleTransparenceXlsxUseCase,
} from './import-nouvelle-transparence.tests-setup';
import { DossierDeNominationContent } from 'shared-models/models/session/dossier-de-nomination';

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
    expect(event.payload.content).toEqual<DossierDeNominationContent>({
      formation: null,
      biography: aDossierDeNominationPayload.content.historique,
      birthDate: aDossierDeNominationPayload.content.dateDeNaissance,
      currentPosition: aDossierDeNominationPayload.content.posteActuel,
      targetedPosition: aDossierDeNominationPayload.content.posteCible,
      dueDate: aDateEchéance,
      folderNumber: aDossierDeNominationPayload.content.numeroDeDossier,
      grade: aDossierDeNominationPayload.content.grade,
      name: aDossierDeNominationPayload.content.magistrat,
      observers: aDossierDeNominationPayload.content.observers ?? [],
      rank: aDossierDeNominationPayload.content.rank,
      lastRankingDate: aDossierDeNominationPayload.content.datePassageAuGrade,
      lastPositionDate:
        aDossierDeNominationPayload.content.datePriseDeFonctionPosteActuel,
    });
  }
});
