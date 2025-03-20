import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { StubUserService } from 'src/reports-context/adapters/secondary/gateways/services/stub-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import { ReportAttachedFileSnapshot } from '../../models/report-attached-file';
import { ReportAttachedFileBuilder } from '../../models/report-attached-file.builder';
import { ReportBuilder } from '../../models/report.builder';
import {
  AttachReportFileUseCase,
  MAX_RETRIES_OF_ATTACH_REPORT_FILE,
} from './attach-report-file';
import { ReportFileUsage } from 'shared-models';
import { OptimisticLockError } from '../../errors/optimistic-lock.error';

const currentDate = new Date(2021, 10, 10);

const fileId = 'file-id';
const anAttachedFile = new ReportAttachedFileBuilder()
  .with('fileId', fileId)
  .with('usage', ReportFileUsage.ATTACHMENT)
  .build();
const anEmbeddedScreenshot = new ReportAttachedFileBuilder()
  .with('fileId', fileId)
  .with('usage', ReportFileUsage.EMBEDDED_SCREENSHOT)
  .build();
const aReportSnapshot = new ReportBuilder().build();

describe('Attach Report File Use Case', () => {
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
    uuidGenerator.nextUuids = [fileId];
    const userService = new StubUserService();
    userService.user = aUser;
    reporterTranslatorService = new ReporterTranslatorService(userService);
    transactionPerformer = new NullTransactionPerformer();

    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
  });

  it('refuses to add a file to a non-existing report', async () => {
    await expect(uploadFile(anAttachedFile)).rejects.toThrow(
      NonExistingReportError,
    );
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

    it("doesn't upload the file if its metadata cannot be saved", async () => {
      reportRepository.saveError = new Error('Failed to save file');
      await expect(uploadFile(anAttachedFile)).rejects.toThrow(
        'Failed to save file',
      );
      expectUploadedFile();
    });

    it("doesn't save file's metadata if upload failed", async () => {
      reportFileService.uploadError = new Error('Failed to upload file');
      await expect(uploadFile(anAttachedFile)).rejects.toThrow(
        'Failed to upload file',
      );
      expecReportWithFile();
    });

    it('saves a file after a failure due to stale repository data', async () => {
      uuidGenerator.nextUuids = [fileId, fileId, fileId];
      reportRepository.saveError = new OptimisticLockError({
        entityName: 'Report',
        entityId: aReportSnapshot.id,
        version: 0,
      });
      reportRepository.saveErrorCountLimit = MAX_RETRIES_OF_ATTACH_REPORT_FILE;

      await uploadFile(anAttachedFile);

      expecReportWithFile(anAttachedFile);
    });

    it.each`
      description                         | file
      ${'uploads an attached file'}       | ${anAttachedFile}
      ${'uploads an embedded screenshot'} | ${anEmbeddedScreenshot}
    `('$description', async ({ file }) => {
      await uploadFile(file);
      expecReportWithFile(file);
      expectUploadedFile(file);
    });

    describe('with an attached file', () => {
      beforeEach(() => {
        const aReportSnapshot = new ReportBuilder()
          .with('attachedFiles', [anAttachedFile])
          .build();

        reportRepository.reports = {
          [aReportSnapshot.id]: aReportSnapshot,
        };
      });

      it("doesn't duplicate file names", async () => {
        await uploadFile(anAttachedFile);
        expecReportWithFile(anAttachedFile);
      });
    });
  });

  const uploadFile = async (aFile: ReportAttachedFileSnapshot) => {
    await new AttachReportFileUseCase(
      reportFileService,
      transactionPerformer,
      reportRepository,
      reporterTranslatorService,
    ).execute(
      aReportSnapshot.id,
      aFile.name,
      Buffer.from('Some content.'),
      aUser.userId,
      aFile.usage,
    );
  };

  const expecReportWithFile = (file?: ReportAttachedFileSnapshot) =>
    expect(Object.values(reportRepository.reports)).toEqual<
      NominationFileReportSnapshot[]
    >([
      {
        ...aReportSnapshot,
        attachedFiles: file ? [file] : null,
      },
    ]);

  const expectUploadedFile = (file?: ReportAttachedFileSnapshot) =>
    expect(Object.values(reportFileService.files)).toEqual(
      file
        ? [
            {
              name: file.name,
            },
          ]
        : [],
    );
});

const aUser = {
  userId: 'user-id',
  firstName: 'john',
  lastName: 'doe',
};
