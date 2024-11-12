import { NominationFile } from 'shared-models';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRule } from '../../models/report-rules';
import { ReportRuleBuilder } from '../../models/report-rules.builder';
import { ReportBuilder } from '../../models/report.builder';
import { getAllRulesPreValidated } from '../report-creation/create-report.use-case.spec';
import {
  UpdateReportOnImportChangePayload,
  UpdateReportOnImportChangeUseCase,
} from './update-report-on-import-change.use-case';
import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { NominationFileReport } from '../../models/nomination-file-report';

const nominationFileId = 'nomination-file-id';

describe('Update Report On Import Change Use Case', () => {
  let reportRuleRepository: FakeReportRuleRepository;
  let reportRepository: FakeNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;

  beforeEach(() => {
    reportRepository = new FakeNominationFileReportRepository();
    reportRepository.reports = {
      [aFirstReport.id]: aFirstReport,
      [aSecondReport.id]: aSecondReport,
    };
    reportRuleRepository = new FakeReportRuleRepository();
    reportRuleRepository.reportRules = {
      [aFirstReportTransferTimeRule.getId()]: aFirstReportTransferTimeRule,
      [aSecondReportTransferTimeRule.getId()]: aSecondReportTransferTimeRule,
    };
    jest.spyOn(reportRuleRepository, 'save');
    transactionPerformer = new NullTransactionPerformer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update the folder number', async () => {
    const updateReportOnImportChangePayload: UpdateReportOnImportChangePayload =
      {
        folderNumber: 10,
      };

    await updateReport(updateReportOnImportChangePayload);

    expectReports(
      new NominationFileReport(
        aFirstReport.id,
        aFirstReport.nominationFileId,
        aFirstReport.createdAt,
        10,
        aFirstReport.biography,
        aFirstReport.dueDate,
        aFirstReport.name,
        aFirstReport.reporterName,
        aFirstReport.birthDate,
        aFirstReport.state,
        aFirstReport.formation,
        aFirstReport.transparency,
        aFirstReport.grade,
        aFirstReport.currentPosition,
        aFirstReport.targettedPosition,
        aFirstReport.comment,
        aFirstReport.rank,
        aFirstReport.observers,
      ),
      aSecondReport,
    );
  });

  it('should update the observers', async () => {
    const updateReportOnImportChangePayload: UpdateReportOnImportChangePayload =
      {
        observers: ['New observer'],
      };

    await updateReport(updateReportOnImportChangePayload);

    expectReports(
      new NominationFileReport(
        aFirstReport.id,
        aFirstReport.nominationFileId,
        aFirstReport.createdAt,
        aFirstReport.folderNumber,
        aFirstReport.biography,
        aFirstReport.dueDate,
        aFirstReport.name,
        aFirstReport.reporterName,
        aFirstReport.birthDate,
        aFirstReport.state,
        aFirstReport.formation,
        aFirstReport.transparency,
        aFirstReport.grade,
        aFirstReport.currentPosition,
        aFirstReport.targettedPosition,
        aFirstReport.comment,
        aFirstReport.rank,
        ['New observer'],
      ),
      aSecondReport,
    );
  });

  it('should update two reports when a transfer time rule changes', async () => {
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

    await updateReport(updateReportOnImportChangePayload);

    const aFirstTransferTimeRuleSnapshot =
      aFirstReportTransferTimeRule.toSnapshot();
    const aSecondTransferTimeRuleSnapshot =
      aSecondReportTransferTimeRule.toSnapshot();
    expectReportRules(
      new ReportRule(
        aFirstTransferTimeRuleSnapshot.id,
        aFirstTransferTimeRuleSnapshot.createdAt,
        aFirstReport.id,
        aFirstTransferTimeRuleSnapshot.ruleGroup,
        aFirstTransferTimeRuleSnapshot.ruleName,
        false,
        aFirstTransferTimeRuleSnapshot.validated,
        aFirstTransferTimeRuleSnapshot.comment,
      ),
      new ReportRule(
        aSecondTransferTimeRuleSnapshot.id,
        aSecondTransferTimeRuleSnapshot.createdAt,
        aSecondReport.id,
        aSecondTransferTimeRuleSnapshot.ruleGroup,
        aSecondTransferTimeRuleSnapshot.ruleName,
        false,
        aSecondTransferTimeRuleSnapshot.validated,
        aSecondTransferTimeRuleSnapshot.comment,
      ),
    );
    expect(reportRuleRepository.save).toHaveBeenCalledTimes(2);
  });

  const updateReport = async (
    updateReportOnImportChangePayload: UpdateReportOnImportChangePayload,
  ) => {
    await new UpdateReportOnImportChangeUseCase(
      reportRepository,
      reportRuleRepository,
      transactionPerformer,
    ).execute(nominationFileId, updateReportOnImportChangePayload);
  };
  const expectReports = (...report: NominationFileReport[]) => {
    expect(Object.values(reportRepository.reports)).toEqual(report);
  };
  const expectReportRules = (...reportRules: ReportRule[]) => {
    expect(Object.values(reportRuleRepository.reportRules)).toEqual(
      reportRules,
    );
  };
});

const aFirstReport = new ReportBuilder()
  .with('id', 'first-report-id')
  .with('nominationFileId', nominationFileId)
  .build();
const aFirstReportTransferTimeRule = new ReportRuleBuilder()
  .with('id', 'first-rule-id')
  .with('reportId', aFirstReport.id)
  .with('ruleGroup', NominationFile.RuleGroup.MANAGEMENT)
  .with('ruleName', NominationFile.ManagementRule.TRANSFER_TIME)
  .with('preValidated', true)
  .build();

const aSecondReport = new ReportBuilder()
  .with('id', 'second-report-id')
  .with('nominationFileId', nominationFileId)
  .build();
const aSecondReportTransferTimeRule = new ReportRuleBuilder()
  .with('id', 'second-rule-id')
  .with('reportId', aSecondReport.id)
  .with('ruleGroup', NominationFile.RuleGroup.MANAGEMENT)
  .with('ruleName', NominationFile.ManagementRule.TRANSFER_TIME)
  .with('preValidated', true)
  .build();
