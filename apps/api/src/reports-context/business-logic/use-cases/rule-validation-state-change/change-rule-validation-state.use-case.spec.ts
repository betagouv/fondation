import { NominationFile } from 'shared-models';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRule, ReportRuleSnapshot } from '../../models/report-rules';
import { ReportRuleBuilder } from '../../models/report-rules.builder';
import { ChangeRuleValidationStateUseCase } from './change-rule-validation-state.use-case';

describe('Change Rule Validation State', () => {
  let reportRuleRepository: FakeReportRuleRepository;
  let transactionPerformer: TransactionPerformer;

  beforeEach(() => {
    reportRuleRepository = new FakeReportRuleRepository();
    transactionPerformer = new NullTransactionPerformer();
  });

  const testData = [
    { initialValidationState: true, expectValidated: false },
    { initialValidationState: false, expectValidated: true },
  ];
  it.each(testData)(
    'switch an oversea to oversea rule validation state from $initialValidationState to $expectValidated',
    async ({ initialValidationState, expectValidated }) => {
      const aReportRuleSnapshot = givenSomeReportRuleExistWithValidatedAt(
        initialValidationState,
      );

      const changeRuleValidationStateUseCase =
        new ChangeRuleValidationStateUseCase(
          reportRuleRepository,
          transactionPerformer,
        );

      await changeRuleValidationStateUseCase.execute(
        aReportRuleSnapshot.id,
        expectValidated,
      );

      expectChangedRuleValidationState(aReportRuleSnapshot, expectValidated);
    },
  );

  const givenSomeReportRuleExistWithValidatedAt = (
    initialValidationState: boolean,
  ): ReportRuleSnapshot => {
    const aReportRuleSnapshot = new ReportRuleBuilder()
      .withOverseasToOverseasRuleValidated(initialValidationState)
      .build();

    reportRuleRepository.reportRules = {
      [aReportRuleSnapshot.id]: aReportRuleSnapshot,
    };

    return aReportRuleSnapshot;
  };

  const expectChangedRuleValidationState = (
    reportRuleSnapshot: ReportRuleSnapshot,
    expectValidated: boolean,
  ) => {
    const savedReport = reportRuleRepository.reportRules[reportRuleSnapshot.id];
    expect(savedReport).toEqual(
      new ReportRule(
        reportRuleSnapshot.id,
        reportRuleSnapshot.createdAt,
        reportRuleSnapshot.reportId,
        NominationFile.RuleGroup.MANAGEMENT,
        NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS,
        reportRuleSnapshot.preValidated,
        expectValidated,
        reportRuleSnapshot.comment,
      ),
    );
  };
});
