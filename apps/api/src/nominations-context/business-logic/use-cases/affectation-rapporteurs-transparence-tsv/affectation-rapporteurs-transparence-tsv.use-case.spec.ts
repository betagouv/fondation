import { Magistrat, Role, RulesBuilder, Transparency } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import {
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
  allRulesMapV1,
} from 'src/data-administration-context/business-logic/models/rules';
import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { AffectationRapporteursTransparenceTsvUseCase } from './affectation-rapporteurs-transparence-tsv.use-case';
import { FakeUserService } from 'src/nominations-context/adapters/secondary/services/fake-user.service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { AffectationSnapshot } from '../../models/affectation';

describe('Affectation des rapporteurs de transparence au format tsv', () => {
  let affectationRepository: FakeAffectationRepository;
  let userService: FakeUserService;

  beforeEach(() => {
    affectationRepository = new FakeAffectationRepository();
    userService = new FakeUserService();
    userService.addUsers(lucLoïcUser);
  });

  it('crée une affectation des rapporteurs aux dossiers de nominations', async () => {
    await new AffectationRapporteursTransparenceTsvUseCase(
      new NullTransactionPerformer(),
      affectationRepository,
    ).execute(firstPayload);

    expect(affectationRepository.getAffectations()).toEqual<
      AffectationSnapshot[]
    >([
      {
        transparenceId: Transparency.AUTOMNE_2024,
        formation: Magistrat.Formation.SIEGE,
        affectationsDossiersDeNominations: [
          {
            dossierDeNominationId: Transparency.AUTOMNE_2024,
            rapporteurIds: [lucLoïcReporterId],
          },
        ],
      },
    ]);
  });
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
const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
};

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
