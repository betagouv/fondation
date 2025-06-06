import {
  Gender,
  Magistrat,
  ReportFileUsage,
  Role,
  TypeDeSaisine,
} from 'shared-models';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import { OptimisticLockError } from '../../errors/optimistic-lock.error';
import { PropositionDeNominationTransparenceV1Dto } from '../../gateways/services/dossier-de-nomination.service';
import { SessionDto } from '../../gateways/services/session.service';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import { ReportAttachedFileSnapshot } from '../../models/report-attached-file';
import { ReportBuilder } from '../../models/report.builder';
import { getDependencies } from '../../test-dependencies';
import { MAX_RETRIES_OF_UPLOADS, ReportFile } from './upload-report-files';

const fileId1 = 'file-id-1';
const fileId2 = 'file-id-2';
const unDossierDeNominationId = 'un-dossier-de-nomination-id';
const uneSessionId = 'une-session-id';

const aReportSnapshot = new ReportBuilder()
  .with('dossierDeNominationId', unDossierDeNominationId)
  .with('sessionId', uneSessionId)
  .build();

const unDossierDeNomination: PropositionDeNominationTransparenceV1Dto = {
  id: unDossierDeNominationId,
  sessionId: uneSessionId,
  nominationFileImportedId: 'nomination-file-imported-id',
  content: {
    folderNumber: 10,
    dueDate: {
      year: 2023,
      month: 10,
      day: 1,
    },
    name: 'a name',
    formation: Magistrat.Formation.PARQUET,
    grade: Magistrat.Grade.HH,
    targettedPosition: 'a position',
    currentPosition: 'a current position',
    birthDate: {
      year: 1980,
      month: 1,
      day: 1,
    },
    biography: 'a biography',
    rank: '1 sur 1',
    observers: ['a list of observers'],
    datePassageAuGrade: null,
    datePriseDeFonctionPosteActuel: null,
    informationCarrière: null,
  },
};

const uneSession: SessionDto = {
  id: uneSessionId,
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  name: 'Nom de session',
  formation: Magistrat.Formation.PARQUET,
  sessionImportéeId: 'session-importée-id',
  version: 1,
  content: {},
};

describe('Upload Report Files Use Case', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.stubUserService.user = aUser;
    dependencies.stubDossierDeNominationService.stubDossier =
      unDossierDeNomination;
    dependencies.stubSessionService.stubSession = uneSession;
  });

  it('refuses to add attachments to a non-existing report', async () => {
    await expect(
      uploadFiles([
        {
          fileId: 'any-file-id',
          name: 'file1.pdf',
          buffer: Buffer.from('content1'),
        },
      ]),
    ).rejects.toThrow(NonExistingReportError);

    expectUploadedFiles();
    expectNoReport();
  });

  describe('when a report exists', () => {
    beforeEach(() => {
      dependencies.fakeReportRepository.reports = {
        [aReportSnapshot.id]: aReportSnapshot,
      };
      dependencies.fakeReportFileService.currentReport = aReportSnapshot;

      dependencies.nullTransactionPerformer.setRollback(() => {
        dependencies.fakeReportRepository.reports = {
          [aReportSnapshot.id]: aReportSnapshot,
        };
      });
    });

    it("doesn't upload the files if metadata cannot be saved", async () => {
      dependencies.fakeReportRepository.saveError = new Error(
        'Failed to save files',
      );

      await expect(
        uploadFiles([
          {
            fileId: 'any-file-id-1',
            name: 'file1.pdf',
            buffer: Buffer.from('content1'),
          },
          {
            fileId: 'any-file-id-2',
            name: 'file2.pdf',
            buffer: Buffer.from('content2'),
          },
        ]),
      ).rejects.toThrow('Failed to save files');

      expectUploadedFiles();
      expectReportWithFiles();
    });

    it("doesn't save files' metadata if upload failed", async () => {
      dependencies.fakeReportFileService.uploadError = new Error(
        'Failed to upload files',
      );

      await expect(
        uploadFiles([
          {
            fileId: 'any-file-id-1',
            name: 'file1.pdf',
            buffer: Buffer.from('content1'),
          },
          {
            fileId: 'any-file-id-2',
            name: 'file2.pdf',
            buffer: Buffer.from('content2'),
          },
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
        {
          fileId: fileId1,
          name: 'file1.pdf',
          buffer: Buffer.from('content1'),
        },
        {
          fileId: fileId2,
          name: 'file2.pdf',
          buffer: Buffer.from('content2'),
        },
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
      dependencies.fakeReportRepository.saveError = new OptimisticLockError({
        entityName: 'Report',
        entityId: aReportSnapshot.id,
        version: 0,
      });
      dependencies.fakeReportRepository.saveErrorCountLimit = 1;

      await uploadFiles([
        {
          fileId: fileId1,
          name: 'file1.pdf',
          buffer: Buffer.from('content1'),
        },
        {
          fileId: fileId2,
          name: 'file2.pdf',
          buffer: Buffer.from('content2'),
        },
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
          .with('dossierDeNominationId', unDossierDeNominationId)
          .with('sessionId', uneSessionId)
          .with('attachedFiles', [
            {
              usage: ReportFileUsage.ATTACHMENT,
              name: 'existing.pdf',
              fileId: 'existing-id',
            },
          ])
          .build();

        dependencies.fakeReportRepository.reports = {
          [aReportSnapshot.id]: reportWithExistingFile,
        };
        dependencies.fakeReportFileService.files = {
          'existing-id': { name: 'existing.pdf' },
        };
      });

      it('appends new files to existing ones', async () => {
        await uploadFiles([
          {
            fileId: fileId1,
            name: 'file1.pdf',
            buffer: Buffer.from('content1'),
          },
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

  const uploadFiles = async (files: ReportFile[]) => {
    await dependencies.uploadReportFilesUseCase.execute(
      aReportSnapshot.id,
      files,
      aUser.userId,
      ReportFileUsage.ATTACHMENT,
      MAX_RETRIES_OF_UPLOADS,
    );
  };

  const expectNoReport = () =>
    expect(Object.values(dependencies.fakeReportRepository.reports)).toEqual<
      NominationFileReportSnapshot[]
    >([]);

  const expectReportWithFiles = (...files: ReportAttachedFileSnapshot[]) =>
    expect(Object.values(dependencies.fakeReportRepository.reports)).toEqual<
      NominationFileReportSnapshot[]
    >([
      {
        ...aReportSnapshot,
        attachedFiles: files.length > 0 ? files : null,
      },
    ]);

  const expectUploadedFiles = (expectedFiles: { name: string }[] = []) =>
    expect(Object.values(dependencies.fakeReportFileService.files)).toEqual(
      expectedFiles,
    );
});

const aUser = {
  userId: 'user-id',
  firstName: 'john',
  lastName: 'doe',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};
