import { FakeS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';
import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FileDocumentBuilder } from '../../builders/file-document.builder';
import { DeleteFilesUseCase } from './delete-files';
import { FileDocumentSnapshot } from '../../models/file-document';
import { DeleteFilesError } from '../../errors/delete-files.error';

describe('Delete Files Use Case', () => {
  let fileRepository: FakeFileRepository;
  let storageProvider: FakeS3StorageProvider;
  let transactionPerformer: NullTransactionPerformer;
  let fileA: FileDocumentSnapshot;
  let fileB: FileDocumentSnapshot;

  beforeEach(() => {
    fileA = new FileDocumentBuilder().build();
    fileB = new FileDocumentBuilder()
      .with('id', 'file-B-id')
      .with('name', 'file-B-name')
      .build();

    fileRepository = new FakeFileRepository();

    const createRepositories = () => {
      fileRepository.files = {
        [fileA.id]: fileA,
        [fileB.id]: fileB,
      };
    };

    storageProvider = new FakeS3StorageProvider();
    storageProvider.addFile(
      fileA.bucket,
      fileA.path,
      fileA.name,
      Buffer.from('test file A.pdf'),
      'application/pdf',
    );
    storageProvider.addFile(
      fileB.bucket,
      fileB.path,
      fileB.name,
      Buffer.from('test file B.pdf'),
      'application/pdf',
    );

    createRepositories();
    transactionPerformer = new NullTransactionPerformer(createRepositories);
  });

  it('should delete multiple files successfully', async () => {
    await deleteFiles([fileA.id, fileB.id]);
    expect(fileRepository.files).toEqual({});
    expect(storageProvider.storedFiles).toEqual({
      [fileA.bucket]: { '': {} },
    });
  });

  it('should handle empty file ids array', async () => {
    await deleteFiles([]);
    expect(Object.keys(fileRepository.files).length).toEqual(2);
  });

  it.each`
    deleteFilesErrorCountLimit | retries
    ${1}                       | ${0}
    ${2}                       | ${1}
  `(
    "keeps all files' metadata if storage deletion failed for any file",
    async ({ deleteFilesErrorCountLimit, retries }) => {
      storageProvider.deleteFilesError = new Error('Storage deletion failed');
      storageProvider.deleteFilesErrorIndex = 1;
      storageProvider.deleteFilesErrorCountLimit = deleteFilesErrorCountLimit;

      await expect(deleteFiles([fileA.id, fileB.id], retries)).rejects.toThrow(
        DeleteFilesError,
      );

      expect(Object.values(fileRepository.files)).toEqual(
        expect.arrayContaining([fileA, fileB]),
      );
      expect(storageProvider.storedFiles).toEqual({
        [fileA.bucket]: {
          '': {
            [fileA.name]: {
              file: Buffer.from('stub buffer of restored file'),
              mimeType: 'application/pdf',
              signedUrl: undefined,
            },
            [fileB.name]: {
              file: Buffer.from('test file B.pdf'),
              mimeType: 'application/pdf',
              signedUrl: undefined,
            },
          },
        },
      });
    },
  );

  it.each`
    deleteFilesErrorCountLimit | retries
    ${1}                       | ${0}
    ${2}                       | ${1}
  `(
    "With $retries retries, it keeps all files' storage if metadata deletion failed for any file",
    async ({ deleteFilesErrorCountLimit, retries }) => {
      fileRepository.deleteFilesError = new Error('Metadata deletion failed');
      fileRepository.deleteFilesErrorIndex = 1;
      fileRepository.deleteFilesErrorCountLimit = deleteFilesErrorCountLimit;

      await expect(deleteFiles([fileA.id, fileB.id], retries)).rejects.toThrow(
        fileRepository.deleteFilesError,
      );

      expect(Object.values(fileRepository.files)).toEqual([fileA, fileB]);

      expect(storageProvider.storedFiles).toEqual({
        [fileA.bucket]: {
          '': {
            [fileA.name]: {
              file: Buffer.from('test file A.pdf'),
              mimeType: 'application/pdf',
              signedUrl: undefined,
            },
            [fileB.name]: {
              file: Buffer.from('test file B.pdf'),
              mimeType: 'application/pdf',
              signedUrl: undefined,
            },
          },
        },
      });
    },
  );

  const deleteFiles = async (fileIds: string[], retries?: number) => {
    await new DeleteFilesUseCase(
      transactionPerformer,
      fileRepository,
      storageProvider,
    ).execute(fileIds, retries);
  };
});
