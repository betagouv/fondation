import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportAttachedFileRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-attached-file.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import { ReportFileService } from '../../gateways/services/report-file-service';
import { ReportAttachedFileSnapshot } from '../../models/report-attached-file';
import { ReportBuilder } from '../../models/report.builder';
import { AttachReportFileUseCase } from './attach-report-file';

describe('Attach Report File Use Case', () => {
  let reportAttachedFileRepository: FakeReportAttachedFileRepository;
  let uuidGenerator: DeterministicUuidGenerator;
  let reportFileService: ReportFileService;
  let dateTimeProvider: DeterministicDateProvider;
  let transactionPerformer: NullTransactionPerformer;
  let reportRepository: FakeNominationFileReportRepository;

  beforeEach(() => {
    reportAttachedFileRepository = new FakeReportAttachedFileRepository();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aFile.id];
    reportFileService = new FakeReportFileService();
    dateTimeProvider = new DeterministicDateProvider();
    transactionPerformer = new NullTransactionPerformer();
    reportRepository = new FakeNominationFileReportRepository();
  });

  it('refuses to add a file to a non-existing report', async () => {
    await expect(uploadFile()).rejects.toThrow(NonExistingReportError);
  });

  describe('when a report exists', () => {
    beforeEach(() => {
      reportRepository.reports = {
        [aReportSnapshot.id]: aReportSnapshot,
      };
    });

    it('attaches a new file', async () => {
      await uploadFile();
      expect(Object.values(reportAttachedFileRepository.files)).toEqual<
        ReportAttachedFileSnapshot[]
      >([
        {
          id: aFile.id,
          createdAt: dateTimeProvider.currentDate,
          reportId: aFile.reportId,
          name: aFile.name,
        },
      ]);
    });
  });

  const uploadFile = async () => {
    await new AttachReportFileUseCase(
      reportAttachedFileRepository,
      uuidGenerator,
      reportFileService,
      dateTimeProvider,
      transactionPerformer,
      reportRepository,
    ).execute(aFile.reportId, aFile.name, Buffer.from('Some content.'));
  };
});

const aReportSnapshot = new ReportBuilder().build();
const aFile: Omit<ReportAttachedFileSnapshot, 'createdAt'> = {
  id: '123',
  reportId: 'report-id',
  name: 'file.txt',
};
