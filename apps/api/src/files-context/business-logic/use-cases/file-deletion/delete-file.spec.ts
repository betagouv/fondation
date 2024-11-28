import { FakeS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';
import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FileDocumentBuilder } from '../../builders/file-document.builder';
import { DeleteFileUseCase } from './delete-file';
import { FileDocumentSnapshot } from '../../models/file-document';

describe('Delete File Use Case', () => {
  let fileRepository: FakeFileRepository;
  let storageProvider: FakeS3StorageProvider;
  let transactionPerformer: NullTransactionPerformer;

  beforeEach(() => {
    const createFakeData = () => {
      fileRepository = new FakeFileRepository();
      fileRepository.files = {
        [aFile.id]: aFile,
      };

      storageProvider = new FakeS3StorageProvider();
      storageProvider.storedFiles = {
        [aFile.name]: {
          bucket: aFile.bucket,
          filePath: aFile.path,
          fileName: aFile.name,
          file: Buffer.from('test file.pdf'),
          mimeType: 'application/pdf',
        },
      };
    };

    createFakeData();
    transactionPerformer = new NullTransactionPerformer(createFakeData);
  });

  it('should delete a file successfully', async () => {
    await deleteFile(aFile);
    expect(fileRepository.files).toEqual({});
    expect(storageProvider.storedFiles).toEqual({});
  });

  it("keeps the file's metadata if storage deletion failed", async () => {
    storageProvider.deleteFileError = new Error('Storage deletion failed');

    await expect(deleteFile(aFile)).rejects.toThrow(
      storageProvider.deleteFileError,
    );
    expect(Object.values(fileRepository.files)).toEqual([aFile]);
  });

  it("keeps the file's stored if metadata deletion failed", async () => {
    fileRepository.deleteFileError = new Error('Metadata deletion failed');

    await expect(deleteFile(aFile)).rejects.toThrow(
      fileRepository.deleteFileError,
    );

    expect(Object.values(fileRepository.files)).toEqual([aFile]);
    expect(storageProvider.storedFiles).toEqual({
      [aFile.name]: {
        bucket: aFile.bucket,
        file: Buffer.from('test file.pdf'),
        fileName: aFile.name,
        filePath: aFile.path,
        mimeType: 'application/pdf',
      },
    });
  });

  const deleteFile = async (file: FileDocumentSnapshot) => {
    await new DeleteFileUseCase(
      transactionPerformer,
      fileRepository,
      storageProvider,
    ).execute(file.id);
  };
});

const aFile = new FileDocumentBuilder().build();
