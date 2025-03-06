import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportAttachedFile } from '../../models/report-attached-file';
import { ReportAttachedFileBuilder } from '../../models/report-attached-file.builder';
import { ReportAttachedFiles } from '../../models/report-attached-files';
import { ReportBuilder } from '../../models/report.builder';
import { DeleteReportAttachedFileUseCase } from './delete-report-attached-file';

describe('Delete Report Attached File Use Case', () => {
  let transactionPerformer: TransactionPerformer;
  let reportRepository: FakeNominationFileReportRepository;
  let reportFileService: FakeReportFileService;

  beforeEach(() => {
    const createRepositories = () => {
      reportRepository = new FakeNominationFileReportRepository();
      reportRepository.reports = {
        [report.id]: report,
      };
    };

    reportFileService = new FakeReportFileService();
    reportFileService.files = {
      [reportAttachedFile.fileId]: {
        name: reportAttachedFile.name,
      },
    };

    createRepositories();
    transactionPerformer = new NullTransactionPerformer(createRepositories);
  });

  it('deletes a report attached file', async () => {
    await deleteFile();
    expect(reportFileService.files).toEqual({});
    expect(Object.values(reportRepository.reports)).toEqual([
      {
        ...report,
        attachedFiles: new ReportAttachedFiles([]),
      },
    ]);
  });

  it("doesn't delete the uploaded file if its metadata cannot be removed", async () => {
    reportRepository.saveError = new Error('Failed to delete');
    await expect(deleteFile()).rejects.toThrow(reportRepository.saveError);
    expect(Object.values(reportFileService.files)).toEqual([
      {
        name: reportAttachedFile.name,
      },
    ]);
  });

  it("doesn't remove a file's metadata if file deletion failed", async () => {
    reportFileService.deleteError = new Error('Failed to delete');
    await expect(deleteFile()).rejects.toThrow(reportFileService.deleteError);
    expect(Object.values(reportRepository.reports)).toEqual([report]);
  });

  const deleteFile = () =>
    new DeleteReportAttachedFileUseCase(
      reportRepository,
      reportFileService,
      transactionPerformer,
    ).execute(report.id, reportAttachedFile.name);
});

const reportAttachedFile = new ReportAttachedFileBuilder().build();
const report = new ReportBuilder()
  .with(
    'attachedFiles',
    new ReportAttachedFiles([
      ReportAttachedFile.fromSnapshot(reportAttachedFile),
    ]),
  )
  .build();
