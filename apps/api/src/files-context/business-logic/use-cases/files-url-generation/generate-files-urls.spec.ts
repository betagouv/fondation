import { FakeS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';
import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileDocumentBuilder } from '../../builders/file-document.builder';
import { FilesStorageProvider } from '../../models/files-provider.enum';
import { GenerateFilesUrlsUseCase } from './generate-files-urls';

describe('Generate Files Urls Use Case', () => {
  let fileRepository: FakeFileRepository;
  let transactionPerformer: TransactionPerformer;
  let s3StorageProvider: FakeS3StorageProvider;

  beforeEach(() => {
    fileRepository = new FakeFileRepository();

    fileRepository.files = {
      [file1.name]: file1,
      [file2.name]: file2,
    };

    s3StorageProvider = new FakeS3StorageProvider();
    s3StorageProvider.storedFiles = {
      [file1.name]: {
        file: Buffer.from('file-content'),
        fileName: file1.name,
        signedUrl: 'signed-url',
        filePath: file1.path,
        mimeType: 'text/plain',
      },
      [file2.name]: {
        file: Buffer.from('second-file-content'),
        fileName: file2.name,
        signedUrl: 'second-signed-url',
        filePath: file2.path,
        mimeType: 'text/plain',
      },
    };

    transactionPerformer = new NullTransactionPerformer();
  });

  it('generates files urls', async () => {
    expect(
      await new GenerateFilesUrlsUseCase(
        fileRepository,
        transactionPerformer,
        s3StorageProvider,
      ).execute([file1.name, file2.name]),
    ).toEqual([
      {
        name: file1.name,
        signedUrl: 'signed-url',
      },
      {
        name: file2.name,
        signedUrl: 'second-signed-url',
      },
    ]);
  });
});
const file1 = new FileDocumentBuilder()
  .with('id', 'file-id')
  .with('name', 'file-name')
  .with('storageProvider', FilesStorageProvider.OUTSCALE)

  .build();
const file2 = new FileDocumentBuilder()
  .with('id', 'second-file-id')
  .with('name', 'second-file-name')
  .with('storageProvider', FilesStorageProvider.OUTSCALE)
  .build();
