import { FileVM } from 'shared-models';
import { FilesStorageProvider } from './files-provider.enum';

export type FileDocumentWithoutId = {
  createdAt: Date;
  name: string;
  bucket: string;
  path: string[] | null;
  storageProvider: FilesStorageProvider;
};

export type PartialFileDocumentSnapshot = Pick<
  FileDocumentSnapshot,
  'id' | 'name'
> & {
  signedUrl: string;
};

export type FileDocumentSnapshot = {
  id: string;
  createdAt: Date;
  name: string;
  bucket: string;
  path: string[] | null;
  storageProvider: FilesStorageProvider;
  signedUrl?: string | null;
};

export class FileDocument {
  constructor(
    private readonly _id: string,
    private readonly createdAt: Date,
    private readonly _name: string,
    private readonly _bucket: string,
    private readonly _path: string[] | null,
    private readonly storageProvider: FilesStorageProvider,
    private signedUrl?: string | null,
  ) {}

  addSignedUrl(signedUrl: string) {
    this.signedUrl = signedUrl;
  }

  getFileVM(): FileVM {
    if (!this.signedUrl) throw new Error('Signed URL is not set');
    return {
      name: this.name,
      signedUrl: this.signedUrl,
    };
  }

  public get id(): string {
    return this._id;
  }
  public get path(): string[] | null {
    return this._path;
  }
  public get name(): string {
    return this._name;
  }
  public get bucket(): string {
    return this._bucket;
  }

  toSnapshot(): FileDocumentSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      name: this.name,
      bucket: this.bucket,
      path: this.path,
      storageProvider: this.storageProvider,
      signedUrl: this.signedUrl,
    };
  }

  static fromSnapshot(reportSnapshot: FileDocumentSnapshot) {
    return new FileDocument(
      reportSnapshot.id,
      reportSnapshot.createdAt,
      reportSnapshot.name,
      reportSnapshot.bucket,
      reportSnapshot.path,
      reportSnapshot.storageProvider,
    );
  }
}
