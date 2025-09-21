import { TypeDeSaisine } from 'shared-models';
import { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
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
    expect(
      event.payload.content,
    ).toEqual<ContenuPropositionDeNominationTransparenceV2>({
      version: 2,
      historique: aDossierDeNominationPayload.content.biography,
      dateDeNaissance: aDossierDeNominationPayload.content.birthDate,
      posteActuel: aDossierDeNominationPayload.content.currentPosition,
      posteCible: aDossierDeNominationPayload.content.targettedPosition,
      dateEchéance: aDateEchéance,
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
    });
  }
});
