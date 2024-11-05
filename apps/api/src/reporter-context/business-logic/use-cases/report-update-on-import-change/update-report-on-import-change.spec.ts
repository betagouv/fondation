import { NominationFile } from 'shared-models';
import { FakeReportRuleRepository } from 'src/reporter-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRule } from '../../models/report-rules';
import { ReportRuleBuilder } from '../../models/report-rules.builder';
import { ReportBuilder } from '../../models/report.builder';
import { getAllRulesPreValidated } from '../report-creation/create-report.use-case.spec';
import {
  UpdateReportOnImportChangePayload,
  UpdateReportOnImportChangeUseCase,
} from './update-report-on-import-change.use-case';
import { FakeNominationFileReportRepository } from 'src/reporter-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';

const nominationFileId = 'nomination-file-id';

describe('Update Report On Import Change Use Case', () => {
  let reportRuleRepository: FakeReportRuleRepository;
  let reportRepository: FakeNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;

  beforeEach(() => {
    reportRepository = new FakeNominationFileReportRepository();
    reportRepository.reports = {
      [aReport.id]: aReport,
    };
    reportRuleRepository = new FakeReportRuleRepository();
    reportRuleRepository.reportRules = {
      [transferTimeRule.getId()]: transferTimeRule,
    };
    jest.spyOn(reportRuleRepository, 'save');
    transactionPerformer = new NullTransactionPerformer();
  });

  it('should update a report on rules change', async () => {
    const updateReportOnImportChangePayload: UpdateReportOnImportChangePayload =
      {
        rules: {
          ...getAllRulesPreValidated(),
          [NominationFile.RuleGroup.MANAGEMENT]: {
            ...getAllRulesPreValidated()[NominationFile.RuleGroup.MANAGEMENT],
            [NominationFile.ManagementRule.TRANSFER_TIME]: false,
          },
        },
      };

    await new UpdateReportOnImportChangeUseCase(
      reportRepository,
      reportRuleRepository,
      transactionPerformer,
    ).execute(nominationFileId, updateReportOnImportChangePayload);

    const transferTimeRuleSnapshot = transferTimeRule.toSnapshot();
    expectReportRules(
      new ReportRule(
        transferTimeRuleSnapshot.id,
        transferTimeRuleSnapshot.createdAt,
        aReport.id,
        transferTimeRuleSnapshot.ruleGroup,
        transferTimeRuleSnapshot.ruleName,
        false,
        transferTimeRuleSnapshot.validated,
        transferTimeRuleSnapshot.comment,
      ),
    );
    expect(reportRuleRepository.save).toHaveBeenCalledTimes(1);
  });

  const expectReportRules = (...reportRules: ReportRule[]) => {
    expect(Object.values(reportRuleRepository.reportRules)).toEqual(
      reportRules,
    );
  };
});

const aReport = new ReportBuilder()
  .withNominationFileId(nominationFileId)
  .build();
const transferTimeRule = new ReportRuleBuilder()
  .withReportId(aReport.id)
  .withRuleGroup(NominationFile.RuleGroup.MANAGEMENT)
  .withRuleName(NominationFile.ManagementRule.TRANSFER_TIME)
  .withPreValidated(true)
  .build();
