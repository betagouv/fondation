import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { NominationFileReport } from '../../models/nomination-file-report';
import { ReportBuilder } from '../../models/report.builder';
import {
  ReportUpdateData,
  UpdateReportUseCase,
} from './update-report.use-case';

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
        comment: 'new comment',
      },
      new NominationFileReport(
        aReport.id,
        aReport.nominationFileId,
        aReport.createdAt,
        aReport.folderNumber,
        aReport.biography,
        aReport.dueDate,
        aReport.name,
        aReport.reporterName,
        aReport.birthDate,
        aReport.state,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.currentPosition,
        aReport.targettedPosition,
        'new comment',
        aReport.rank,
        aReport.observers,
      ),
    ],
    [
      {
        comment: null,
      },
      new NominationFileReport(
        aReport.id,
        aReport.nominationFileId,
        aReport.createdAt,
        aReport.folderNumber,
        aReport.biography,
        aReport.dueDate,
        aReport.name,
        aReport.reporterName,
        aReport.birthDate,
        aReport.state,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.currentPosition,
        aReport.targettedPosition,
        null,
        aReport.rank,
        aReport.observers,
      ),
    ],
    [
      {
        comment: '',
      },
      new NominationFileReport(
        aReport.id,
        aReport.nominationFileId,
        aReport.createdAt,
        aReport.folderNumber,
        aReport.biography,
        aReport.dueDate,
        aReport.name,
        aReport.reporterName,
        aReport.birthDate,
        aReport.state,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.currentPosition,
        aReport.targettedPosition,
        null,
        aReport.rank,
        aReport.observers,
      ),
    ],
  ];
  it.each(testData)(
    'updates with this new data: %s',
    async (newData, report) => {
      await new UpdateReportUseCase(
        reportRepository,
        transactionPerformer,
      ).execute(aReport.id, newData);
      expectChangedReport(report);
    },
  );

  const expectChangedReport = (report: NominationFileReport) => {
    const savedReport = reportRepository.reports[report.id];
    expect(savedReport).toEqual(report);
  };
});
