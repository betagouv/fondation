import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
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

  const testData: [ReportUpdateData, NominationFileReportSnapshot][] = [
    [
      {
        comment: 'new comment',
      },
      new ReportBuilder().with('comment', 'new comment').build(),
    ],
    [
      {
        comment: null,
      },
      new ReportBuilder().with('comment', null).build(),
    ],
    [
      {
        comment: '',
      },
      new ReportBuilder().with('comment', null).build(),
    ],

    [
      {
        state: NominationFile.ReportState.IN_PROGRESS,
      },
      new ReportBuilder()
        .with('state', NominationFile.ReportState.IN_PROGRESS)
        .build(),
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

  const expectChangedReport = (report: NominationFileReportSnapshot) => {
    const savedReport = reportRepository.reports[report.id];
    expect(savedReport).toEqual(report);
  };
});
