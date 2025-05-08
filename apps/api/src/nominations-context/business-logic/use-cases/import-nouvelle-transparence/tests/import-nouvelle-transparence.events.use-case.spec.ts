import { Magistrat } from 'shared-models';
import { NouveauDossierDeNominationEvent } from '../../../models/events/nouveau-dossier-de-nomination.event';
import { currentDate, getDependencies } from '../../../../tests-dependencies';
import {
  aDossierDeNominationId,
  anEventId,
  aSessionId,
  givenSomeUuids,
  importNouvelleTransparenceUseCase,
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
    await importNouvelleTransparenceUseCase(dependencies);
  }

  function expectEventPublié() {
    const event = dependencies.domainEventRepository
      .events[0] as NouveauDossierDeNominationEvent;
    expect(event).toBeInstanceOf(NouveauDossierDeNominationEvent);
    expect(event.id).toBe(anEventId);
    expect(event.occurredOn).toBe(currentDate);
    expect(event.payload.dossierDeNominationId).toBe(aDossierDeNominationId);
    expect(event.payload.sessionId).toBe(aSessionId);
    expect(event.payload.content).toEqual({
      biography: 'Nominee biography',
      birthDate: { day: 1, month: 1, year: 1980 },
      currentPosition: 'Current position',
      targettedPosition: 'Target position',
      dueDate: { day: 1, month: 6, year: 2023 },
      folderNumber: 1,
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.I,
      name: 'Nominee Name',
      observers: [],
      rank: 'A',
    });
  }
});
