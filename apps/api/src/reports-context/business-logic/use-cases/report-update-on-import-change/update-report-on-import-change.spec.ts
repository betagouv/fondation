import { NominationFile } from 'shared-models';
import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import { ReportRuleSnapshot } from '../../models/report-rules';
import { ReportRuleBuilder } from '../../models/report-rules.builder';
import { ReportBuilder } from '../../models/report.builder';
import { getAllRulesPreValidated } from '../report-creation/create-report.use-case.spec';
import {
  UpdateReportOnImportChangePayload,
  UpdateReportOnImportChangeUseCase,
} from './update-report-on-import-change.use-case';

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
      [aFirstTransferTimeRuleSnapshot.id]: aFirstTransferTimeRuleSnapshot,
      [aSecondTransferTimeRuleSnapshot.id]: aSecondTransferTimeRuleSnapshot,
    };
    jest.spyOn(reportRuleRepository, 'save');
    transactionPerformer = new NullTransactionPerformer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update the folder number', async () => {
    const payload: UpdateReportOnImportChangePayload = {
      folderNumber: 10,
    };
    await updateReport(payload);
    expectReports(
      { ...aFirstReport, folderNumber: 10 },
      { ...aSecondReport, folderNumber: 10 },
    );
  });

  it('should update the observers', async () => {
    const payload: UpdateReportOnImportChangePayload = {
      observers: ['New observer'],
    };
    await updateReport(payload);
    expectReports(
      { ...aFirstReport, observers: ['New observer'] },
      { ...aSecondReport, observers: ['New observer'] },
    );
  });

  it('should update two reports when a transfer time rule changes', async () => {
    const payload: UpdateReportOnImportChangePayload = {
      rules: {
        ...getAllRulesPreValidated(),
        [NominationFile.RuleGroup.MANAGEMENT]: {
          ...getAllRulesPreValidated()[NominationFile.RuleGroup.MANAGEMENT],
          [NominationFile.ManagementRule.TRANSFER_TIME]: false,
        },
      },
    };
    await updateReport(payload);
    expectReportRules(
      { ...aFirstTransferTimeRuleSnapshot, preValidated: false },
      { ...aSecondTransferTimeRuleSnapshot, preValidated: false },
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
  const expectReports = (...reports: NominationFileReportSnapshot[]) => {
    expect(Object.values(reportRepository.reports)).toEqual(reports);
  };
  const expectReportRules = (...reportRules: ReportRuleSnapshot[]) => {
    expect(Object.values(reportRuleRepository.reportRules)).toEqual(
      reportRules,
    );
  };
});

const aFirstReport = new ReportBuilder()
  .with('id', 'first-report-id')
  .with('nominationFileId', nominationFileId)
  .build();
const aFirstTransferTimeRuleSnapshot = new ReportRuleBuilder()
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
const aSecondTransferTimeRuleSnapshot = new ReportRuleBuilder()
  .with('id', 'second-rule-id')
  .with('reportId', aSecondReport.id)
  .with('ruleGroup', NominationFile.RuleGroup.MANAGEMENT)
  .with('ruleName', NominationFile.ManagementRule.TRANSFER_TIME)
  .with('preValidated', true)
  .build();
