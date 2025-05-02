import { Magistrat, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { NominationFileReadRulesBuilder } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { NouveauDossierDeNominationEvent } from '../../../models/events/nouveau-dossier-de-nomination.event';
import { TypeDeSaisine } from '../../../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from '../Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../import-nouvelle-transparence.use-case';
import {
  getDependencies,
  currentDate,
} from '../../transparence.use-case.tests-dependencies';

describe('Nouvelle transparence GDS - Events', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.uuidGenerator.nextUuids = [
      aDossierDeNominationId,
      anEventId,
      aSessionId,
    ];
  });

  it("publie un événement NouveauDossierDeNominationEvent lors de la création d'un dossier", async () => {
    await créerDossiersDeNomination();
    expectEventPublié();
  });

  async function créerDossiersDeNomination() {
    await new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      dependencies.transparenceService,
    ).execute(aCommand);
  }

  function expectEventPublié() {
    expect(dependencies.domainEventRepository.events).toHaveLength(1);

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

const aTransparencyName = Transparency.AUTOMNE_2024;
const aFormation = Magistrat.Formation.PARQUET;
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const aDossierDeNominationId = 'dossier-de-nomination-id';

const aDossierDeNominationPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'][number] =
  {
    transparency: aTransparencyName,
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
    reporterIds: ['reporter-1'],
    rules: new NominationFileReadRulesBuilder().build(),
  };

const aCommand = new ImportNouvelleTransparenceCommand(
  aTypeDeSaisine,
  aTransparencyName,
  [aFormation],
  [aDossierDeNominationPayload],
);

const anEventId = 'event-id';
const aSessionId = aTransparencyName;
