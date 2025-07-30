import { FakeS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';

import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { StubPermissionsService } from 'src/files-context/adapters/secondary/services/stub-permissions.service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileDocumentBuilder } from '../../builders/file-document.builder';
import { PermissionDeniedError } from '../../errors/permission-denied.error';
import { GenerateFilesUrlsUseCase } from './generate-files-urls';

describe('Generate Files Urls Use Case', () => {
  let transactionPerformer: TransactionPerformer;
  let fileRepository: FakeFileRepository;
  let s3StorageProvider: FakeS3StorageProvider;
  let permissionsService: StubPermissionsService;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();

    fileRepository = new FakeFileRepository();
    fileRepository.files = {
      [file1.id]: file1,
      [file2.id]: file2,
    };

    s3StorageProvider = new FakeS3StorageProvider();
    s3StorageProvider.addFile(
      file1.bucket,
      file1.path,
      file1.name,
      Buffer.from('file-content'),
      'text/plain',
      'signed-url',
    );
    s3StorageProvider.addFile(
      file2.bucket,
      file2.path,
      file2.name,
      Buffer.from('second-file-content'),
      'text/plain',
      'second-signed-url',
    );

    permissionsService = new StubPermissionsService();
  });

  it('requires a file permission to get an url', async () => {
    permissionsService.canReadFile = false;
    await expect(generateFilesUrlsUseCase(file1.id)).rejects.toThrow(
      PermissionDeniedError,
    );
  });

  it('generates files urls', async () => {
    permissionsService.canReadFile = true;
    expect(await generateFilesUrlsUseCase(file1.id, file2.id)).toEqual([
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

  const generateFilesUrlsUseCase = (...fileIds: string[]) =>
    new GenerateFilesUrlsUseCase(
      fileRepository,
      transactionPerformer,
      s3StorageProvider,
      permissionsService,
    ).execute(fileIds, 'stub-user-id');
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
