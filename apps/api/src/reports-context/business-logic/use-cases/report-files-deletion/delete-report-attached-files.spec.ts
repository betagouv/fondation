import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import { ReportAttachedFileBuilder } from '../../models/report-attached-file.builder';
import { ReportBuilder } from '../../models/report.builder';
import { DeleteReportAttachedFilesUseCase } from './delete-report-attached-files';
import { ReportAttachedFileSnapshot } from '../../models/report-attached-file';

describe('Delete Report Attached Files Use Case', () => {
  let transactionPerformer: TransactionPerformer;
  let reportRepository: FakeNominationFileReportRepository;
  let reportFileService: FakeReportFileService;

  const reportAttachedFile1 = new ReportAttachedFileBuilder().build();

  const reportAttachedFile2 = new ReportAttachedFileBuilder()
    .with('name', 'file2.pdf')
    .with('fileId', 'file-id-2')
    .build();

  const report = new ReportBuilder()
    .with('attachedFiles', [reportAttachedFile1, reportAttachedFile2])
    .build();

  beforeEach(() => {
    reportRepository = new FakeNominationFileReportRepository();
    const createRepositories = () => {
      reportRepository.reports = {
        [report.id]: report,
      };
    };

    reportFileService = new FakeReportFileService();
    reportFileService.files = {
      [reportAttachedFile1.fileId]: { name: reportAttachedFile1.name },
      [reportAttachedFile2.fileId]: { name: reportAttachedFile2.name },
    };

    createRepositories();
    transactionPerformer = new NullTransactionPerformer(createRepositories);
  });

  it('deletes multiple report attached files', async () => {
    await deleteFiles([reportAttachedFile1.name, reportAttachedFile2.name]);

    expect(reportFileService.files).toEqual({});
    expectReportWithFiles();
  });

  it('deletes only specified files', async () => {
    await deleteFiles([reportAttachedFile1.name]);

    expect(reportFileService.files).toEqual({
      [reportAttachedFile2.fileId]: { name: reportAttachedFile2.name },
    });

    expectReportWithFiles(reportAttachedFile2);
  });

  it('does not delete files metadata if storage deletion failed', async () => {
    reportFileService.deleteFilesError = new Error('Failed to delete');

    await expect(deleteFiles([reportAttachedFile1.name])).rejects.toThrow(
      reportFileService.deleteFileError,
    );

    expectReportWithFiles(reportAttachedFile1, reportAttachedFile2);
  });

  it('throws error if report not found', async () => {
    reportRepository.reports = {};
    await expect(deleteFiles([reportAttachedFile1.name])).rejects.toThrow(
      'Report not found',
    );
  });

  const deleteFiles = (fileNames: string[]) =>
    new DeleteReportAttachedFilesUseCase(
      reportRepository,
      reportFileService,
      transactionPerformer,
    ).execute(report.id, fileNames);

  const expectReportWithFiles = (...files: ReportAttachedFileSnapshot[]) =>
    expect(Object.values(reportRepository.reports)).toEqual<
      NominationFileReportSnapshot[]
    >([
      {
        ...report,
        attachedFiles: files,
      },
    ]);
});
