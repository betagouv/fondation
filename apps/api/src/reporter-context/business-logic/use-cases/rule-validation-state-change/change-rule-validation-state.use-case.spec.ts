import { FakeReportRuleRepository } from 'src/reporter-context/adapters/secondary/repositories/fake-report-rule.repository';
import { NominationFileManagementRule } from '../../models/nomination-file-report';
import { ReportRule, ReportRuleSnapshot } from '../../models/report-rules';
import { ReportRuleBuilder } from '../../models/report-rules.builder';
import { ChangeRuleValidationStateUseCase } from './change-rule-validation-state.use-case';
import { NominationFile } from '@/shared-models';

describe('Change Rule Validation State', () => {
  let reportRuleRepository: FakeReportRuleRepository;

  beforeEach(() => {
    reportRuleRepository = new FakeReportRuleRepository();
  });

  const testData = [
    { initialValidationState: true, expectValidated: false },
    { initialValidationState: false, expectValidated: true },
  ];
  it.each(testData)(
    'switch an oversea to oversea rule validation state from $initialValidationState to $expectValidated',
    async ({ initialValidationState, expectValidated }) => {
      const aReportRule = givenSomeReportRuleExistWithValidatedAt(
        initialValidationState,
      );
      const aReportRuleSnapshot = aReportRule.toSnapshot();

      const changeRuleValidationStateUseCase =
        new ChangeRuleValidationStateUseCase(reportRuleRepository);

      await changeRuleValidationStateUseCase.execute(
        aReportRuleSnapshot.id,
        expectValidated,
      );

      await expectChangedRuleValidationState(
        aReportRuleSnapshot,
        expectValidated,
      );
    },
  );

  const givenSomeReportRuleExistWithValidatedAt = (
    initialValidationState: boolean,
  ): ReportRule => {
    const aReportRule = new ReportRuleBuilder()
      .withOverseasToOverseasRuleValidated(initialValidationState)
      .build();
    const aReportRuleSnapshot = aReportRule.toSnapshot();

    reportRuleRepository.reportRules = {
      [aReportRuleSnapshot.id]: aReportRule,
    };

    return aReportRule;
  };

  const expectChangedRuleValidationState = async (
    reportRuleSnapshot: ReportRuleSnapshot,
    expectValidated: boolean,
  ) => {
    const savedReport = await reportRuleRepository.byId(reportRuleSnapshot.id);
    expect(savedReport).toEqual(
      new ReportRule(
        reportRuleSnapshot.id,
        reportRuleSnapshot.reportId,
        NominationFile.RuleGroup.MANAGEMENT,
        NominationFileManagementRule.OVERSEAS_TO_OVERSEAS,
        reportRuleSnapshot.preValidated,
        expectValidated,
        reportRuleSnapshot.comment,
      ),
    );
  };
});
