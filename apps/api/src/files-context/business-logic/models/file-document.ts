import { FilesStorageProvider } from './files-provider.enum';

export type FileVM = { name: string; signedUrl: string };

export type FileDocumentSnapshot = {
  id: string;
  createdAt: Date;
  name: string;
  path: string[] | null;
  storageProvider: FilesStorageProvider;
  signedUrl?: string | null;
};

export class FileDocument {
  constructor(
    private readonly _id: string,
    private readonly createdAt: Date,
    private readonly name: string,
    private readonly path: string[] | null,
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

  toSnapshot(): FileDocumentSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      name: this.name,
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
      reportSnapshot.path,
      reportSnapshot.storageProvider,
    );
  }
}
