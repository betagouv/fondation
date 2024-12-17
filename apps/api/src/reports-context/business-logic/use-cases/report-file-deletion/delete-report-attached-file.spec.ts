import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportAttachedFileRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-attached-file.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportBuilder } from '../../models/report.builder';
import { ReportAttachedFileBuilder } from '../../models/report-attached-file.builder';
import { DeleteReportAttachedFileUseCase } from './delete-report-attached-file';

describe('Delete Report Attached File Use Case', () => {
  let transactionPerformer: TransactionPerformer;
  let reportRepository: FakeNominationFileReportRepository;
  let reportAttachedFileRepository: FakeReportAttachedFileRepository;
  let reportFileService: FakeReportFileService;

  beforeEach(() => {
    const createRepositories = () => {
      reportRepository = new FakeNominationFileReportRepository();
      reportRepository.reports = {
        [report.id]: report,
      };

      reportAttachedFileRepository = new FakeReportAttachedFileRepository();
      reportAttachedFileRepository.files = {
        [reportAttachedFile.name]: reportAttachedFile,
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
    expect(reportAttachedFileRepository.files).toEqual({});
  });

  it("doesn't delete the uploaded file if its metadata cannot be removed", async () => {
    reportAttachedFileRepository.deleteError = new Error('Failed to delete');
    await expect(deleteFile()).rejects.toThrow(
      reportAttachedFileRepository.deleteError,
    );
    expect(Object.values(reportFileService.files)).toEqual([
      {
        name: reportAttachedFile.name,
      },
    ]);
  });

  it("doesn't remove a file's metadata if file deletion failed", async () => {
    reportFileService.deleteError = new Error('Failed to delete');
    await expect(deleteFile()).rejects.toThrow(reportFileService.deleteError);
    expect(Object.values(reportAttachedFileRepository.files)).toEqual([
      reportAttachedFile,
    ]);
  });

  const deleteFile = () =>
    new DeleteReportAttachedFileUseCase(
      reportAttachedFileRepository,
      reportFileService,
      transactionPerformer,
    ).execute(report.id, reportAttachedFile.name);
});

const report = new ReportBuilder().build();
const reportAttachedFile = new ReportAttachedFileBuilder()
  .with('reportId', report.id)
  .build();
