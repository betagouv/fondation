import { FakeS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';
import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileDocumentBuilder } from '../../builders/file-document.builder';
import { GenerateFilesUrlsUseCase } from './generate-files-urls';

describe('Generate Files Urls Use Case', () => {
  let transactionPerformer: TransactionPerformer;
  let fileRepository: FakeFileRepository;
  let s3StorageProvider: FakeS3StorageProvider;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();

    fileRepository = new FakeFileRepository();
    fileRepository.files = {
      [file1.id]: file1,
      [file2.id]: file2,
    };

    s3StorageProvider = new FakeS3StorageProvider();
    s3StorageProvider.storedFiles = {
      [file1.name]: {
        file: Buffer.from('file-content'),
        fileName: file1.name,
        signedUrl: 'signed-url',
        bucket: 'bucket-1',
        filePath: file1.path,
        mimeType: 'text/plain',
      },
      [file2.name]: {
        file: Buffer.from('second-file-content'),
        fileName: file2.name,
        signedUrl: 'second-signed-url',
        bucket: 'bucket-2',
        filePath: file2.path,
        mimeType: 'text/plain',
      },
    };
  });

  it('generates files urls', async () => {
    expect(
      await new GenerateFilesUrlsUseCase(
        fileRepository,
        transactionPerformer,
        s3StorageProvider,
      ).execute([file1.id, file2.id]),
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
  .build();
const file2 = new FileDocumentBuilder()
  .with('id', 'second-file-id')
  .with('name', 'second-file-name')
  .with('path', ['folder', 'sub-folder'])
  .build();
