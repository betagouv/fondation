import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { ReportAttachedFileBuilder } from '../../models/report-attached-file.builder';
import { ReportBuilder } from '../../models/report.builder';
import { GenerateReportFileUrlUseCase } from './generate-report-file-url';

describe('Generate Report File Url', () => {
  let reportRepository: FakeNominationFileReportRepository;
  let reportFileService: FakeReportFileService;
  let transactionPerformer: NullTransactionPerformer;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();

    reportRepository = new FakeNominationFileReportRepository();
    reportRepository.reports = {
      [report.id]: report,
    };

    reportFileService = new FakeReportFileService();
    reportFileService.files[reportAttachedFile.fileId] = {
      name: reportAttachedFile.name,
      signedUrl: 'signed-url',
    };
  });

  it('generates an url', async () => {
    expect(
      await new GenerateReportFileUrlUseCase(
        transactionPerformer,
        reportRepository,
        reportFileService,
      ).execute(report.id, reportAttachedFile.name),
    ).toEqual('signed-url');
  });
});

const reportAttachedFile = new ReportAttachedFileBuilder().build();
const report = new ReportBuilder()
  .with('attachedFiles', [reportAttachedFile])
  .build();
