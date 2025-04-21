import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import {
  NominationFilesImportedEvent,
  NominationFilesImportedEventPayload,
} from 'src/data-administration-context/business-logic/models/events/nomination-file-imported.event';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/business-logic/models/rules';
import { FakeTransparenceRepository } from 'src/nominations-context/adapters/gateways/repositories/fake-transparence.repository';
import { GdsTransparencesImportedListener } from './gds-transparences-imported.listener';
import {
  ImportNouvelleTransparenceCommand,
  ImportNouvelleTransparenceUseCase,
} from '../use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TypeDeSaisine } from '../models/type-de-saisine';

describe('GDS transparences imported listener', () => {
  let nouvelleTransparenceUseCase: ImportNouvelleTransparenceUseCase;

  beforeEach(() => {
    nouvelleTransparenceUseCase = new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      new FakeTransparenceRepository(),
    );
    nouvelleTransparenceUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('importe deux nouvelles transparences GDS', async () => {
    await listenEvent(anEvent);

    expect(nouvelleTransparenceUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      anEvent.payload,
    );
  });

  // describe("Transparence existante", () => {
  //   beforeEach(() => {
  //   it('ne crée pas de nouvelle transparence GDS si elle existe déjà', async () => {
  //     const transparence = Transparency.DU_03_MARS_2025;
  //     const payload = givenAnImportEventPayload({
  //       transparency,
  //       formation: Magistrat.Formation.PARQUET,
  //     });
  //     const payload2 = givenAnImportEventPayload({
  //       transparency,
  //       formation: Magistrat.Formation.COUR_DE_CASSATION,
  //     });
  //     const event = givenAnImportEvent(payload, payload2);
  //     await listenEvent(event);
  //     expect(nouvelleTransparenceUseCase.execute).toHaveBeenCalledTimes(0);

  //   })

  const listenEvent = (event: NominationFilesImportedEvent) =>
    new GdsTransparencesImportedListener(nouvelleTransparenceUseCase).handle(
      event.payload,
    );

  const expectNouvelleTransparenceNthCalledWith = (
    nth: number,
    transparence: Transparency,
  ) => {
    expect(nouvelleTransparenceUseCase.execute).toHaveBeenNthCalledWith(
      nth,
      new ImportNouvelleTransparenceCommand(
        TypeDeSaisine.TRANSPARENCE_GDS,
        transparence,
        [firstPayload.content.formation],
      ),
    );
  };
});

class PayloadRules extends RulesBuilder<
  boolean,
  ManagementRule,
  StatutoryRule,
  QualitativeRule
> {
  constructor() {
    super(true, allRulesMapV1);
  }
}

const givenAnImportEventPayload = (
  overrideContent?: Partial<
    NominationFilesImportedEventPayload[number]['content']
  >,
) => {
  const payload: NominationFilesImportedEventPayload[number] = {
    nominationFileImportedId: 'nominationFileImportedId',
    content: {
      transparency: Transparency.AUTOMNE_2024,
      biography: 'biography',
      birthDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      currentPosition: 'currentPosition',
      targettedPosition: 'targettedPosition',
      dueDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      folderNumber: 1,
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.I,
      name: 'name',
      observers: [],
      rank: 'rank',
      reporters: [],
      rules: new PayloadRules().build(),
      ...overrideContent,
    },
  };
  return payload;
};

const givenAnImportEvent = (
  ...payloads: NominationFilesImportedEventPayload
) => {
  return new NominationFilesImportedEvent('event-id', payloads, new Date());
};

const firstPayload = givenAnImportEventPayload({
  transparency: Transparency.AUTOMNE_2024,
});
const secondPayload = givenAnImportEventPayload({
  transparency: Transparency.DU_03_MARS_2025,
});
const thirdPayload = givenAnImportEventPayload({
  transparency: Transparency.DU_03_MARS_2025,
});
const anEvent = givenAnImportEvent(firstPayload, secondPayload, thirdPayload);
