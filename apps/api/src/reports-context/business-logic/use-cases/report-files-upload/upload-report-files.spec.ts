import { ReportFileUsage } from 'shared-models';
import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { StubUserService } from 'src/reports-context/adapters/secondary/gateways/services/stub-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import { OptimisticLockError } from '../../errors/optimistic-lock.error';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import { ReportAttachedFileSnapshot } from '../../models/report-attached-file';
import { ReportBuilder } from '../../models/report.builder';
import {
  AttachmentFile,
  MAX_RETRIES_OF_UPLOADS,
  UploadReportFilesUseCase,
} from './upload-report-files';

const currentDate = new Date(2021, 10, 10);
const fileId1 = 'file-id-1';
const fileId2 = 'file-id-2';
const aReportSnapshot = new ReportBuilder().build();

describe('Upload Report Files Use Case', () => {
  let reportFileService: FakeReportFileService;
  let dateTimeProvider: DeterministicDateProvider;
  let transactionPerformer: NullTransactionPerformer;
  let reportRepository: FakeNominationFileReportRepository;
  let uuidGenerator: DeterministicUuidGenerator;
  let reporterTranslatorService: ReporterTranslatorService;

  beforeEach(() => {
    reportFileService = new FakeReportFileService();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    reportRepository = new FakeNominationFileReportRepository();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [fileId1, fileId2];
    const userService = new StubUserService();
    userService.user = aUser;
    reporterTranslatorService = new ReporterTranslatorService(userService);
    transactionPerformer = new NullTransactionPerformer();

    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
  });

  it('refuses to add attachments to a non-existing report', async () => {
    await expect(
      uploadFiles([{ name: 'file1.pdf', buffer: Buffer.from('content1') }]),
    ).rejects.toThrow(NonExistingReportError);

    expectUploadedFiles();
    expectNoReport();
  });

  describe('when a report exists', () => {
    beforeEach(() => {
      reportRepository.reports = {
        [aReportSnapshot.id]: aReportSnapshot,
      };
      reportFileService.currentReport = aReportSnapshot;

      transactionPerformer = new NullTransactionPerformer(() => {
        reportRepository.reports = {
          [aReportSnapshot.id]: aReportSnapshot,
        };
      });
    });

    it("doesn't upload the files if metadata cannot be saved", async () => {
      reportRepository.saveError = new Error('Failed to save files');

      await expect(
        uploadFiles([
          { name: 'file1.pdf', buffer: Buffer.from('content1') },
          { name: 'file2.pdf', buffer: Buffer.from('content2') },
        ]),
      ).rejects.toThrow('Failed to save files');

      expectUploadedFiles();
      expectReportWithFiles();
    });

    it("doesn't save files' metadata if upload failed", async () => {
      reportFileService.uploadError = new Error('Failed to upload files');

      await expect(
        uploadFiles([
          { name: 'file1.pdf', buffer: Buffer.from('content1') },
          { name: 'file2.pdf', buffer: Buffer.from('content2') },
        ]),
      ).rejects.toThrow('Failed to upload files');

      expectReportWithFiles();
      expectUploadedFiles();
    });

    it('uploads no files when the list is empty', async () => {
      await uploadFiles([]);

      expectReportWithFiles();
      expectUploadedFiles();
    });

    it('uploads multiple attachments', async () => {
      await uploadFiles([
        { name: 'file1.pdf', buffer: Buffer.from('content1') },
        { name: 'file2.pdf', buffer: Buffer.from('content2') },
      ]);

      expectReportWithFiles(
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: 'file1.pdf',
          fileId: fileId1,
        },
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: 'file2.pdf',
          fileId: fileId2,
        },
      );
      expectUploadedFiles([{ name: 'file1.pdf' }, { name: 'file2.pdf' }]);
    });

    it('saves files after a failure due to stale repository data', async () => {
      uuidGenerator.nextUuids = [fileId1, fileId2, fileId1, fileId2];
      reportRepository.saveError = new OptimisticLockError({
        entityName: 'Report',
        entityId: aReportSnapshot.id,
        version: 0,
      });
      reportRepository.saveErrorCountLimit = 1;

      await uploadFiles([
        { name: 'file1.pdf', buffer: Buffer.from('content1') },
        { name: 'file2.pdf', buffer: Buffer.from('content2') },
      ]);

      expectReportWithFiles(
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: 'file1.pdf',
          fileId: fileId1,
        },
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: 'file2.pdf',
          fileId: fileId2,
        },
      );
      expectUploadedFiles([{ name: 'file1.pdf' }, { name: 'file2.pdf' }]);
    });

    describe('with existing attached files', () => {
      beforeEach(() => {
        const reportWithExistingFile = new ReportBuilder()
          .with('attachedFiles', [
            {
              usage: ReportFileUsage.ATTACHMENT,
              name: 'existing.pdf',
              fileId: 'existing-id',
            },
          ])
          .build();

        reportRepository.reports = {
          [aReportSnapshot.id]: reportWithExistingFile,
        };
        reportFileService.files = {
          'existing-id': { name: 'existing.pdf' },
        };
      });

      it('appends new files to existing ones', async () => {
        await uploadFiles([
          { name: 'file1.pdf', buffer: Buffer.from('content1') },
        ]);

        expectReportWithFiles(
          {
            usage: ReportFileUsage.ATTACHMENT,
            name: 'existing.pdf',
            fileId: 'existing-id',
          },
          {
            usage: ReportFileUsage.ATTACHMENT,
            name: 'file1.pdf',
            fileId: fileId1,
          },
        );
        expectUploadedFiles([{ name: 'existing.pdf' }, { name: 'file1.pdf' }]);
      });
    });
  });

  const uploadFiles = async (files: AttachmentFile[]) => {
    await new UploadReportFilesUseCase(
      reportFileService,
      transactionPerformer,
      reportRepository,
      reporterTranslatorService,
    ).execute(
      aReportSnapshot.id,
      files,
      aUser.userId,
      ReportFileUsage.ATTACHMENT,
      MAX_RETRIES_OF_UPLOADS,
    );
  };

  const expectNoReport = () =>
    expect(Object.values(reportRepository.reports)).toEqual<
      NominationFileReportSnapshot[]
    >([]);

  const expectReportWithFiles = (...files: ReportAttachedFileSnapshot[]) =>
    expect(Object.values(reportRepository.reports)).toEqual<
      NominationFileReportSnapshot[]
    >([
      {
        ...aReportSnapshot,
        attachedFiles: files.length > 0 ? files : null,
      },
    ]);

  const expectUploadedFiles = (expectedFiles: { name: string }[] = []) =>
    expect(Object.values(reportFileService.files)).toEqual(expectedFiles);
});

const aUser = {
  userId: 'user-id',
  firstName: 'john',
  lastName: 'doe',
};
