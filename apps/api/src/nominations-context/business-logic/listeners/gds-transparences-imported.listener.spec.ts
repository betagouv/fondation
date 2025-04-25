import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/business-logic/models/rules';
import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { FakeTransparenceRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TypeDeSaisine } from '../models/type-de-saisine';
import { AffectationRapporteursTransparenceTsvUseCase } from '../use-cases/affectation-rapporteurs-transparence-tsv/affectation-rapporteurs-transparence-tsv.use-case';
import {
  ImportNouvelleTransparenceCommand,
  ImportNouvelleTransparenceUseCase,
} from '../use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { GdsTransparencesImportedListener } from './gds-transparences-imported.listener';

describe('GDS transparences imported listener', () => {
  let nouvelleTransparenceUseCase: ImportNouvelleTransparenceUseCase;
  let affectationRapporteursTransparenceTsvUseCase: AffectationRapporteursTransparenceTsvUseCase;

  beforeEach(() => {
    nouvelleTransparenceUseCase = new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      new FakeTransparenceRepository(),
    );
    nouvelleTransparenceUseCase.execute = jest.fn();

    affectationRapporteursTransparenceTsvUseCase =
      new AffectationRapporteursTransparenceTsvUseCase(
        new NullTransactionPerformer(),
        new FakeAffectationRepository(),
      );
    affectationRapporteursTransparenceTsvUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('crée la session', async () => {
    await listenEvent();
    expectNouvelleTransparenceCalledWith(Transparency.AUTOMNE_2024);
  });

  it("crée l'affectation des rapporteurs", async () => {
    await listenEvent();
    expectAffectationCalledWithPayload();
  });

  const listenEvent = () =>
    new GdsTransparencesImportedListener(
      nouvelleTransparenceUseCase,
      affectationRapporteursTransparenceTsvUseCase,
    ).handle(firstPayload);

  const expectNouvelleTransparenceCalledWith = (transparence: Transparency) => {
    expect(nouvelleTransparenceUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      new ImportNouvelleTransparenceCommand(
        TypeDeSaisine.TRANSPARENCE_GDS,
        transparence,
        firstPayload.formations,
      ),
    );
  };

  const expectAffectationCalledWithPayload = () =>
    expect(
      affectationRapporteursTransparenceTsvUseCase.execute,
    ).toHaveBeenCalledExactlyOnceWith(firstPayload);
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

const lucLoïcReporterId = 'luc-loic-reporter-id';

const firstPayload: GdsNewTransparenceImportedEventPayload = {
  transparenceId: Transparency.AUTOMNE_2024,
  formations: [Magistrat.Formation.SIEGE],
  nominationFiles: [
    {
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
      reporterIds: [lucLoïcReporterId],
      rules: new PayloadRules().build(),
    },
  ],
};
