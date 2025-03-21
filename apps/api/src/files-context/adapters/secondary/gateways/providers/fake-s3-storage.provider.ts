import { FileVM } from 'shared-models';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';

type FileName = string;
type Bucket = string;
type FilePath = string;

export class FakeS3StorageProvider implements S3StorageProvider {
  uploadFileError: Error;
  deleteFileError: Error;
  deleteFilesError: Error;
  deleteFilesErrorIndex = 0;
  deleteFilesErrorCount = 0;
  deleteFilesErrorCountLimit = Infinity;
  restoreFilesError: Error;

  storedFiles: Record<
    Bucket,
    Record<
      FilePath,
      Record<
        FileName,
        {
          file: Buffer;
          mimeType: string;
          signedUrl?: string;
        }
      >
    >
  > = {};

  async uploadFile(
    file: Buffer,
    fileName: FileName,
    mimeType: string,
    bucket: string,
    filePath: string[] | null,
  ): Promise<void> {
    if (this.uploadFileError) throw this.uploadFileError;

    this.storedFiles = {
      ...this.storedFiles,
      [bucket]: {
        ...this.storedFiles[bucket],
        [filePath?.join('/') || '']: {
          [fileName]: {
            file,
            mimeType,
          },
        },
      },
    };
  }

  async getSignedUrls(files: FileDocument[]): Promise<FileVM[]> {
    return files.map((file) => {
      const { name, bucket, path } = file.toSnapshot();
      const fileStored =
        this.storedFiles[bucket]![path?.join('/') || '']![name];
      file.addSignedUrl(
        fileStored?.signedUrl || this.genSignedUrl(bucket, path, name),
      );
      return file.getFileVM();
    });
  }

  async deleteFile(
    bucket: string,
    filePath: string[] | null,
    fileName: FileName,
  ): Promise<void> {
    if (this.deleteFileError) throw this.deleteFileError;

    delete this.storedFiles[bucket]![filePath?.join('/') || '']![fileName];
  }

  async deleteFiles(
    files: FileDocument[],
  ): Promise<PromiseSettledResult<void>[]> {
    return Promise.allSettled(
      files.map(async (file, index) => {
        if (
          this.deleteFilesError &&
          this.deleteFilesErrorIndex === index &&
          this.deleteFilesErrorCount < this.deleteFilesErrorCountLimit
        ) {
          this.deleteFilesErrorCount = this.deleteFilesErrorCount + 1;
          throw this.deleteFilesError;
        }

        delete this.storedFiles[file.bucket]![file.path?.join('/') || '']![
          file.name
        ];
      }),
    );
  }

  async restoreFiles(files: FileDocument[]): Promise<void> {
    if (this.restoreFilesError) throw this.restoreFilesError;

    for (const file of files) {
      this.addFile(
        file.bucket,
        file.path,
        file.name,
        Buffer.from('stub buffer of restored file'),
        'application/pdf',
      );
    }
  }

  addFile(
    bucket: Bucket,
    path: string[] | null,
    fileName: FileName,
    file: Buffer,
    mimeType: string,
    signedUrl?: string,
  ) {
    this.storedFiles = {
      ...this.storedFiles,
      [bucket]: {
        ...this.storedFiles[bucket],
        [path?.join('/') || '']: {
          ...this.storedFiles[bucket]?.[path?.join('/') || ''],
          [fileName]: {
            file,
            mimeType,
            signedUrl,
          },
        },
      },
    };
  }

  genSignedUrl(
    bucket: Bucket,
    path: string[] | null,
    fileName: FileName,
  ): string {
    return `http://example.fr/${bucket}/${path ? path.join('/') + '/' : ''}${fileName}`;
  }
}
