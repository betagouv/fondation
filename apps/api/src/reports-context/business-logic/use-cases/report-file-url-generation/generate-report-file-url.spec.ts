import { FakeReportAttachedFileRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-attached-file.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { ReportAttachedFileSnapshot } from '../../models/report-attached-file';
import { GenerateReportFileUrlUseCase } from './generate-report-file-url';

describe('Generate Report File Url', () => {
  let reportAttachedFileRepository: FakeReportAttachedFileRepository;
  let reportFileService: FakeReportFileService;
  let transactionPerformer: NullTransactionPerformer;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();

    reportAttachedFileRepository = new FakeReportAttachedFileRepository();
    reportAttachedFileRepository.files = {
      [aFile.name]: aFile,
    };

    reportFileService = new FakeReportFileService();
    reportFileService.files[aFile.fileId] = {
      name: aFile.name,
      signedUrl: 'signed-url',
    };
  });

  it('generates an url', async () => {
    expect(
      await new GenerateReportFileUrlUseCase(
        transactionPerformer,
        reportAttachedFileRepository,
        reportFileService,
      ).execute(aFile.reportId, aFile.name),
    ).toEqual('signed-url');
  });
});

const aFile: ReportAttachedFileSnapshot = {
  createdAt: new Date(2025, 10, 10),
  reportId: 'report-id',
  name: 'file-name',
  fileId: 'file-id',
};
