import { FakeS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';
import { FakeFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/fake-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileDocumentSnapshot } from '../../models/file-document';
import { UploadFileUseCase } from './upload-file';
import { FilesStorageProvider } from '../../models/files-provider.enum';

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
    fakeS3StorageProvider = new FakeS3StorageProvider();

    transactionPerformer = new NullTransactionPerformer(() => {
      fileRepository = new FakeFileRepository();
      fakeS3StorageProvider = new FakeS3StorageProvider();
    });
  });

  it("uploads a file to a provider's storage", async () => {
    const file = getFile();
    await uploadFile(file);
    expect(fakeS3StorageProvider.storedFiles).toEqual<
      FakeS3StorageProvider['storedFiles']
    >({
      [file.bucket]: {
        [file.path?.join('/') || '']: {
          [file.name]: {
            file: Buffer.from('file content'),
            mimeType: 'text/plain',
          },
        },
      },
    });
  });

  it.each`
    fileName           | bucket        | filePath
    ${'file-name.pdf'} | ${'Bucket 1'} | ${null}
    ${'file-name.txt'} | ${'bucket-2'} | ${['folder', 'subfolder']}
  `(
    'saves a file $fileName with its metadata',
    async ({ fileName, bucket, filePath }) => {
      const file = getFile({ name: fileName, bucket, path: filePath });
      await uploadFile(file);
      expect(Object.values(fileRepository.files)).toEqual([file]);
    },
  );

  it("doesn't store the file if its metadata cannot be saved", async () => {
    fileRepository.saveFileError = new Error('Failed to save file metadata');
    const file = getFile();
    await expect(uploadFile(file)).rejects.toThrow(
      fileRepository.saveFileError,
    );
    expect(fakeS3StorageProvider.storedFiles).toEqual({});
  });

  it("doesn't save a file's metadata if its storage failed", async () => {
    fakeS3StorageProvider.uploadFileError = new Error('Failed to upload file');
    const file = getFile();
    await expect(uploadFile(file)).rejects.toThrow(
      fakeS3StorageProvider.uploadFileError,
    );
    expect(fileRepository.files).toEqual({});
  });

  const uploadFile = async (
    file: FileDocumentSnapshot,
    mimeType: string = 'text/plain',
  ) =>
    await new UploadFileUseCase(
      fileRepository,
      transactionPerformer,
      dateTimeProvider,
      fakeS3StorageProvider,
    ).execute(
      file.id,
      Buffer.from('file content'),
      file.name,
      mimeType,
      file.bucket,
      file.path,
    );
});

const getFile = (
  override?: Partial<FileDocumentSnapshot>,
): FileDocumentSnapshot => ({
  id: 'file-id',
  createdAt: currentDate,
  bucket: 'fondation',
  name: 'file-name.txt',
  path: null,
  storageProvider: FilesStorageProvider.OUTSCALE,
  signedUrl: undefined,
  ...override,
});
