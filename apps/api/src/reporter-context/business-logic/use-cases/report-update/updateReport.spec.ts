import { FakeNominationFileReportRepository } from 'src/reporter-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { NominationFileReport } from '../../models/nomination-file-report';
import { ReportBuilder } from '../../models/report.builder';
import {
  ReportUpdateData,
  UpdateReportUseCase,
} from './update-report.use-case';
import { NominationFile } from 'shared-models';

const aReport = new ReportBuilder().build();

describe('Report Update Use Case', () => {
  let reportRepository: FakeNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;

  beforeEach(() => {
    reportRepository = new FakeNominationFileReportRepository();
    transactionPerformer = new NullTransactionPerformer();

    reportRepository.reports = {
      [aReport.id]: aReport,
    };
  });

  const testData: [ReportUpdateData, NominationFileReport][] = [
    [
      {
        state: NominationFile.ReportState.READY_TO_SUPPORT,
      },
      new NominationFileReport(
        aReport.id,
        aReport.createdAt,
        aReport.biography,
        aReport.dueDate,
        aReport.name,
        aReport.birthDate,
        NominationFile.ReportState.READY_TO_SUPPORT,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.currentPosition,
        aReport.targettedPosition,
        aReport.comment,
        aReport.rank,
      ),
    ],
    [
      {
        biography: 'new biography',
      },
      new NominationFileReport(
        aReport.id,
        aReport.createdAt,
        'new biography',
        aReport.dueDate,
        aReport.name,
        aReport.birthDate,
        aReport.state,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.currentPosition,
        aReport.targettedPosition,
        aReport.comment,
        aReport.rank,
      ),
    ],
    [
      {
        comment: 'new comment',
      },
      new NominationFileReport(
        aReport.id,
        aReport.createdAt,
        aReport.biography,
        aReport.dueDate,
        aReport.name,
        aReport.birthDate,
        aReport.state,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.currentPosition,
        aReport.targettedPosition,
        'new comment',
        aReport.rank,
      ),
    ],
    [
      {
        state: NominationFile.ReportState.IN_PROGRESS,
        biography: 'new biography',
        comment: 'new comment',
      },
      new NominationFileReport(
        aReport.id,
        aReport.createdAt,
        'new biography',
        aReport.dueDate,
        aReport.name,
        aReport.birthDate,
        NominationFile.ReportState.IN_PROGRESS,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.currentPosition,
        aReport.targettedPosition,
        'new comment',
        aReport.rank,
      ),
    ],
  ];
  it.each(testData)('updates with this new data: %s', async (newData) => {
    await new UpdateReportUseCase(
      reportRepository,
      transactionPerformer,
    ).execute(aReport.id, newData);

    expectChangedReportValidationState(aReport, newData);
  });

  const expectChangedReportValidationState = (
    report: NominationFileReport,
    newData: ReportUpdateData,
  ) => {
    const savedReport = reportRepository.reports[report.id];
    expect(savedReport).toEqual(
      new NominationFileReport(
        report.id,
        aReport.createdAt,
        newData.biography || report.biography,
        report.dueDate,
        report.name,
        report.birthDate,
        newData.state || report.state,
        report.formation,
        report.transparency,
        report.grade,
        report.currentPosition,
        report.targettedPosition,
        newData.comment || report.comment,
        report.rank,
      ),
    );
  };
});
