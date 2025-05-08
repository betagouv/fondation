import { allRulesMapV2, RulesBuilder } from 'shared-models';
import { ReportRuleSnapshot } from '../../models/report-rules';
import { getDependencies } from '../../test-dependencies';
import { CréerAnalyseCommand } from './créer-analyse.use-case';

describe('Création Analyse', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.uuidGenerator.genUuids(21);
  });

  it('crée une analyse', async () => {
    await créerAnalyse();
    expectRulesV2();
  });

  const créerAnalyse = () =>
    dependencies.créerAnalyseUseCase.execute(uneCommande);

  const expectRulesV2 = () => {
    expectRules(
      ...Object.values(
        new ReportRulesBuilder(({ ruleGroup, ruleName }) => {
          return {
            id: expect.any(String),
            createdAt: dependencies.dateTimeProvider.currentDate,
            reportId: rapportId,
            ruleGroup,
            ruleName,
            validated: true,
          };
        }, allRulesMapV2).build(),
      )
        .map((r) => Object.values(r))
        .flat()
        .flat(),
    );
  };

  const expectRules = (...rules: ReportRuleSnapshot[]) => {
    expect(
      Object.values(dependencies.fakeReportRuleRepository.reportRules),
    ).toEqual(rules);
  };
});

const rapportId = 'rapport-id';
const uneCommande = new CréerAnalyseCommand(rapportId);

class ReportRulesBuilder extends RulesBuilder<ReportRuleSnapshot> {}
