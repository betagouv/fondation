import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportAttachedFileRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-attached-file.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from '../../models/report-attached-file';
import { ReportAttachedFiles } from '../../models/report-attached-files';
import { ReportBuilder } from '../../models/report.builder';
import { AttachReportFileUseCase } from './attach-report-file';
import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { StubUserService } from 'src/reports-context/adapters/secondary/gateways/services/stub-user.service';

const currentDate = new Date(2021, 10, 10);

const aReportBuilder = new ReportBuilder();
const aFile: ReportAttachedFileSnapshot = {
  createdAt: currentDate,
  reportId: aReportBuilder.build().id,
  name: 'image-1.png',
  fileId: 'file-id',
};

describe('Attach Report File Use Case', () => {
  let reportAttachedFileRepository: FakeReportAttachedFileRepository;
  let reportFileService: FakeReportFileService;
  let dateTimeProvider: DeterministicDateProvider;
  let transactionPerformer: NullTransactionPerformer;
  let reportRepository: FakeNominationFileReportRepository;
  let uuidGenerator: DeterministicUuidGenerator;
  let reporterTranslatorService: ReporterTranslatorService;

  beforeEach(() => {
    reportAttachedFileRepository = new FakeReportAttachedFileRepository();
    reportFileService = new FakeReportFileService();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    reportRepository = new FakeNominationFileReportRepository();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aFile.fileId];
    const userService = new StubUserService();
    userService.user = aUser;
    reporterTranslatorService = new ReporterTranslatorService(userService);

    transactionPerformer = new NullTransactionPerformer(() => {
      reportAttachedFileRepository = new FakeReportAttachedFileRepository();
    });
  });

  it('refuses to add a file to a non-existing report', async () => {
    await expect(uploadFile()).rejects.toThrow(NonExistingReportError);
  });

  describe('when a report exists', () => {
    const aReportSnapshot = aReportBuilder.build();

    beforeEach(() => {
      reportRepository.reports = {
        [aReportSnapshot.id]: aReportSnapshot,
      };
      reportFileService.currentReport = aReportSnapshot;
    });

    it('attaches a new file', async () => {
      await uploadFile();

      expect(Object.values(reportAttachedFileRepository.files)).toEqual<
        ReportAttachedFileSnapshot[]
      >([aFile]);
      expect(Object.values(reportFileService.files)).toEqual([
        {
          name: aFile.name,
        },
      ]);
    });

    it("doesn't upload the file if its metadata cannot be saved", async () => {
      reportAttachedFileRepository.saveError = new Error('Failed to save file');
      await expect(uploadFile()).rejects.toThrow('Failed to save file');
      expect(reportFileService.files).toEqual({});
    });

    it("doesn't save file's metadata if upload failed", async () => {
      reportFileService.uploadError = new Error('Failed to upload file');
      await expect(uploadFile()).rejects.toThrow('Failed to upload file');
      expect(reportAttachedFileRepository.files).toEqual({});
    });

    describe('with an attached file', () => {
      beforeEach(() => {
        const aReportSnapshot = aReportBuilder
          .with(
            'attachedFiles',
            new ReportAttachedFiles([ReportAttachedFile.fromSnapshot(aFile)]),
          )
          .build();
        reportRepository.reports = {
          [aReportSnapshot.id]: aReportSnapshot,
        };
        reportAttachedFileRepository.files = {
          [aFile.name]: aFile,
        };
      });

      it("doesn't duplicate file names", async () => {
        await uploadFile();
        expect(Object.values(reportAttachedFileRepository.files)).toEqual<
          ReportAttachedFileSnapshot[]
        >([aFile]);
      });
    });
  });

  const uploadFile = async () => {
    await new AttachReportFileUseCase(
      reportAttachedFileRepository,
      reportFileService,
      dateTimeProvider,
      transactionPerformer,
      reportRepository,
      uuidGenerator,
      reporterTranslatorService,
    ).execute(
      aFile.reportId,
      aFile.name,
      Buffer.from('Some content.'),
      aUser.userId,
    );
  };
});

const aUser = {
  userId: 'user-id',
  firstName: 'john',
  lastName: 'doe',
};
