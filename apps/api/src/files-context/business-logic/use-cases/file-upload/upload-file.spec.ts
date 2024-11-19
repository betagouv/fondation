import { FakeS3StorageProvider } from 'src/data-administration-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';
import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileDocumentSnapshot } from '../../models/file-document';
import { UploadFileUseCase } from './upload-file';

const fileId = 'file-id';
const currentDate = new Date(2025, 5, 5);

describe('Upload file', () => {
  let fileRepository: FakeFileRepository;
  let uuidGenerator: DeterministicUuidGenerator;
  let dateTimeProvider: DeterministicDateProvider;
  let transactionPerformer: TransactionPerformer;
  let fakeS3StorageProvider: FakeS3StorageProvider;

  beforeEach(() => {
    fileRepository = new FakeFileRepository();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [fileId];
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    transactionPerformer = new NullTransactionPerformer();
    fakeS3StorageProvider = new FakeS3StorageProvider();
  });

  it("uploads a file to a provider's storage", async () => {
    const file = getFile();
    fakeS3StorageProvider.fileUri = file.uri;

    await uploadFile(file);

    expect(Object.values(fakeS3StorageProvider.storedFiles)).toEqual([
      {
        file: Buffer.from('file content'),
        fileName: file.name,
      },
    ]);
  });

  it.each`
    fileUri
    ${'https://example.fr/file-name.txt'}
    ${'https://example.com/file-name.pdf'}
  `('saves a file metadata: $fileUri', async ({ fileUri }) => {
    fakeS3StorageProvider.fileUri = fileUri;
    const file = getFile({ uri: fileUri });

    await uploadFile(file);

    expect(Object.values(fileRepository.files)).toEqual([file]);
  });

  it('delete the file if the metadata saving fails', async () => {
    fileRepository.saveError = new Error('Failed to save file metadata');
    const file = getFile();

    await expect(uploadFile(file)).rejects.toThrow(
      'Failed to save file metadata',
    );
    expect(fakeS3StorageProvider.storedFiles).toEqual({});
  });

  const uploadFile = async (file: FileDocumentSnapshot) => {
    await new UploadFileUseCase(
      fileRepository,
      transactionPerformer,
      uuidGenerator,
      dateTimeProvider,
      fakeS3StorageProvider,
    ).execute(Buffer.from('file content'), file.name);
  };
});

const getFile = (
  override?: Partial<FileDocumentSnapshot>,
): FileDocumentSnapshot => ({
  id: 'file-id',
  createdAt: currentDate,
  name: 'file-name.txt',
  provider: 'outscale',
  uri: 'https://example.fr/file-name.txt',
  ...override,
});
