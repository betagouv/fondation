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
  aParquetSessionId,
  givenSomeUuids,
  givenUneSession,
  importNouveauxDossiersUseCase,
} from './import-nouveaux-dossiers-transparence.tests-setup';
import { DossierDeNominationContent } from 'shared-models/models/session/dossier-de-nomination';

describe('Nouvelle transparence GDS - Events', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
    givenUneSession(dependencies.sessionRepository);
  });

  it("publie un événement NouveauDossierDeNominationEvent lors de la création d'un dossier", async () => {
    await créerDossiersDeNomination();
    expectEventPublié();
  });

  async function créerDossiersDeNomination() {
    await importNouveauxDossiersUseCase(dependencies);
  }

  function expectEventPublié() {
    const event = dependencies.domainEventRepository
      .events[0] as NouveauDossierDeNominationEvent<TypeDeSaisine.TRANSPARENCE_GDS>;
    expect(event).toBeInstanceOf(NouveauDossierDeNominationEvent);
    expect(event.id).toBe(anEventId);
    expect(event.occurredOn).toBe(currentDate);
    expect(event.payload.dossierDeNominationId).toBe(aDossierDeNominationId);
    expect(event.payload.sessionId).toBe(aParquetSessionId);
    expect(event.payload.content).toEqual<DossierDeNominationContent>({
      biography: aDossierDeNominationPayload.content.biography,
      birthDate: aDossierDeNominationPayload.content.birthDate,
      currentPosition: aDossierDeNominationPayload.content.currentPosition,
      targetedPosition: aDossierDeNominationPayload.content.targettedPosition,
      dueDate: aDateEchéance,
      folderNumber: aDossierDeNominationPayload.content.folderNumber,
      grade: aDossierDeNominationPayload.content.grade,
      name: aDossierDeNominationPayload.content.name,
      observers: aDossierDeNominationPayload.content.observers ?? [],
      rank: aDossierDeNominationPayload.content.rank,
      lastRankingDate: aDossierDeNominationPayload.content.datePassageAuGrade,
      lastPositionDate:
        aDossierDeNominationPayload.content.datePriseDeFonctionPosteActuel,
      formation: null,
    });
  }
});
