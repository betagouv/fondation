import { FakeS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';
import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UploadFilesError } from '../../errors/upload-files.error';
import { UploadFilesUseCase } from './upload-files';
import { FileDocumentSnapshot } from '../../models/file-document';
import { FilesStorageProvider } from '../../models/files-provider.enum';

describe('Upload Files Use Case', () => {
  let fileRepository: FakeFileRepository;
  let storageProvider: FakeS3StorageProvider;
  let transactionPerformer: TransactionPerformer;
  let dateTimeProvider: DeterministicDateProvider;

  beforeEach(() => {
    fileRepository = new FakeFileRepository();
    storageProvider = new FakeS3StorageProvider();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;

    fileRepository = new FakeFileRepository();
    storageProvider = new FakeS3StorageProvider();
    const createRepositories = () => {
      fileRepository.files = {};
    };

    transactionPerformer = new NullTransactionPerformer(createRepositories);
  });

  it('should upload multiple files successfully', async () => {
    await uploadFiles([fileA, fileB]);

    expectFiles(
      {
        id: fileA.fileId,
        name: fileA.fileName,
        bucket: fileA.bucket,
        path: fileA.filePath,
        createdAt: currentDate,
        storageProvider: FilesStorageProvider.SCALEWAY,
      },
      {
        id: fileB.fileId,
        name: fileB.fileName,
        bucket: fileB.bucket,
        path: fileB.filePath,
        createdAt: currentDate,
        storageProvider: FilesStorageProvider.SCALEWAY,
      },
    );
    expectS3Files(
      {
        file: fileA.file,
        mimeType: fileA.mimeType,
        fileName: fileA.fileName,
      },
      {
        file: fileB.file,
        mimeType: fileB.mimeType,
        fileName: fileB.fileName,
      },
    );
  });

  it('should handle empty files array', async () => {
    await uploadFiles([]);
    expect(Object.keys(fileRepository.files).length).toEqual(0);
    expect(storageProvider.storedFiles).toEqual({});
  });

  it('should clean up S3 files if any upload fails', async () => {
    storageProvider.uploadFilesError = new Error('Storage upload failed');
    storageProvider.uploadFilesErrorIndex = 1;

    await expect(uploadFiles([fileA, fileB])).rejects.toThrow(UploadFilesError);

    expect(Object.values(fileRepository.files)).toEqual([]);
    expectS3Files();
  });

  it.each`
    retries
    ${0}
    ${1}
  `(
    'should not upload to S3 if metadata save fails with $retries retries',
    async ({ retries }) => {
      fileRepository.saveFileError = new Error('Metadata save failed');

      await expect(uploadFiles([fileA], retries)).rejects.toThrow(
        fileRepository.saveFileError,
      );

      expect(storageProvider.storedFiles).toEqual({});
    },
  );

  it('uploads after a retry', async () => {
    fileRepository.saveFileError = new Error('Metadata save failed');
    fileRepository.saveFileErrorCountLimit = 1;

    await uploadFiles([fileA], 1);

    expectFiles({
      id: fileA.fileId,
      name: fileA.fileName,
      path: fileA.filePath,
      createdAt: currentDate,
      bucket: fileA.bucket,
      storageProvider: FilesStorageProvider.SCALEWAY,
    });
    expectS3Files({
      file: fileA.file,
      mimeType: fileA.mimeType,
      fileName: fileA.fileName,
    });
  });

  const uploadFiles = async (
    files: Array<{
      fileId: string;
      fileName: string;
      mimeType: string;
      file: Buffer;
      bucket: string;
      filePath: string[] | null;
    }>,
    retries?: number,
  ) => {
    await new UploadFilesUseCase(
      fileRepository,
      transactionPerformer,
      dateTimeProvider,
      storageProvider,
    ).execute(files, retries);
  };

  const expectFiles = (...files: FileDocumentSnapshot[]) => {
    expect(Object.keys(fileRepository.files).length).toEqual(files.length);
    expect(Object.values(fileRepository.files)).toEqual(files);
  };

  const expectS3Files = (
    ...files: ({
      fileName: string;
    } & FakeS3StorageProvider['storedFiles'][string][string][string])[]
  ) => {
    expect(storageProvider.storedFiles).toEqual({
      [bucket]: {
        '': {
          ...files.reduce(
            (acc, f) => ({
              ...acc,
              [f.fileName]: { file: f.file, mimeType: f.mimeType },
            }),
            {},
          ),
        },
      },
    });
  };
});

const currentDate = new Date(2025, 5, 5);
const bucket = 'test-bucket';
const fileA = {
  fileId: 'file-A-id',
  fileName: 'file-A-name.pdf',
  mimeType: 'application/pdf',
  file: Buffer.from('test file A.pdf'),
  bucket,
  filePath: null,
};
const fileB = {
  fileId: 'file-B-id',
  fileName: 'file-B-name.pdf',
  mimeType: 'application/pdf',
  file: Buffer.from('test file B.pdf'),
  bucket,
  filePath: null,
};
