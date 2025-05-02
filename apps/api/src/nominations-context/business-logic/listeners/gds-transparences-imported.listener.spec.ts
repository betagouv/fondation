import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/business-logic/models/rules';
import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakePréAnalyseRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeSessionRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-session.repository';
import { TransparenceService } from 'src/nominations-context/business-logic/services/transparence.service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TypeDeSaisine } from '../models/type-de-saisine';
import { ImportNouvelleTransparenceCommand } from '../use-cases/import-nouvelle-transparence/Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { GdsTransparencesImportedListener } from './gds-transparences-imported.listener';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';

describe('GDS transparences imported listener', () => {
  let nouvelleTransparenceUseCase: ImportNouvelleTransparenceUseCase;

  beforeEach(() => {
    nouvelleTransparenceUseCase = new ImportNouvelleTransparenceUseCase(
      new NullTransactionPerformer(),
      new TransparenceService(
        new FakeDossierDeNominationRepository(),
        new FakePréAnalyseRepository(),
        new FakeSessionRepository(),
        new FakeAffectationRepository(),
        new FakeDomainEventRepository(),
      ),
    );
    nouvelleTransparenceUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('crée la session', async () => {
    await listenEvent();
    expectNouvelleTransparenceCalledWith(Transparency.AUTOMNE_2024);
  });

  const listenEvent = () =>
    new GdsTransparencesImportedListener(nouvelleTransparenceUseCase).handle(
      firstPayload,
    );

  const expectNouvelleTransparenceCalledWith = (transparence: Transparency) => {
    expect(nouvelleTransparenceUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      new ImportNouvelleTransparenceCommand(
        TypeDeSaisine.TRANSPARENCE_GDS,
        transparence,
        firstPayload.formations,
        [dossierDeNominationPayload],
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

const lucLoïcReporterId = 'luc-loic-reporter-id';

const dossierDeNominationPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'][number] =
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
  };
const firstPayload: GdsNewTransparenceImportedEventPayload = {
  transparenceId: Transparency.AUTOMNE_2024,
  formations: [Magistrat.Formation.SIEGE],
  nominationFiles: [dossierDeNominationPayload],
};
