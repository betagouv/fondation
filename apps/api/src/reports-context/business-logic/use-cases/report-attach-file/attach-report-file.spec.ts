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
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from '../../models/report-attached-file';
import { ReportAttachedFiles } from '../../models/report-attached-files';
import { ReportBuilder } from '../../models/report.builder';
import { AttachReportFileUseCase } from './attach-report-file';

const currentDate = new Date(2021, 10, 10);

const aReportBuilder = new ReportBuilder();
const aFile: ReportAttachedFileSnapshot = {
  reportId: aReportBuilder.build().id,
  name: 'image-1.png',
  fileId: 'file-id',
};
const aReportSnapshot = aReportBuilder.build();

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
    uuidGenerator.nextUuids = [aFile.fileId];
    const userService = new StubUserService();
    userService.user = aUser;
    reporterTranslatorService = new ReporterTranslatorService(userService);
    transactionPerformer = new NullTransactionPerformer();

    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
  });

  it('refuses to add a file to a non-existing report', async () => {
    await expect(uploadFile()).rejects.toThrow(NonExistingReportError);
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

    it('attaches a new file', async () => {
      await uploadFile();
      expecReportWithFile(aFile);
      expectUploadedFile(aFile);
    });

    it("doesn't upload the file if its metadata cannot be saved", async () => {
      reportRepository.saveError = new Error('Failed to save file');
      await expect(uploadFile()).rejects.toThrow('Failed to save file');
      expectUploadedFile();
    });

    it("doesn't save file's metadata if upload failed", async () => {
      reportFileService.uploadError = new Error('Failed to upload file');
      await expect(uploadFile()).rejects.toThrow('Failed to upload file');
      expecReportWithFile();
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
      });

      it("doesn't duplicate file names", async () => {
        await uploadFile();
        expecReportWithFile(aFile);
      });
    });
  });

  const uploadFile = async () => {
    await new AttachReportFileUseCase(
      reportFileService,
      transactionPerformer,
      reportRepository,
      reporterTranslatorService,
    ).execute(
      aFile.reportId,
      aFile.name,
      Buffer.from('Some content.'),
      aUser.userId,
    );
  };

  const expecReportWithFile = (file?: ReportAttachedFileSnapshot) =>
    expect(Object.values(reportRepository.reports)).toEqual<
      NominationFileReportSnapshot[]
    >([
      {
        ...aReportSnapshot,
        attachedFiles: file
          ? new ReportAttachedFiles([ReportAttachedFile.fromSnapshot(file)])
          : null,
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
