import { FilesStorageProvider } from './files-provider.enum';

export type FileDocumentSnapshot = {
  id: string;
  createdAt: Date;
  name: string;
  storageProvider: FilesStorageProvider;
  uri: string;
};

export class FileDocument {
  constructor(
    private readonly _id: string,
    private readonly createdAt: Date,
    private readonly name: string,
    private readonly storageProvider: FilesStorageProvider,
    private readonly uri: string,
  ) {}

  public get id(): string {
    return this._id;
  }

  toSnapshot(): FileDocumentSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      name: this.name,
      storageProvider: this.storageProvider,
      uri: this.uri,
    };
  }

  static fromSnapshot(reportSnapshot: FileDocumentSnapshot) {
    return new FileDocument(
      reportSnapshot.id,
      reportSnapshot.createdAt,
      reportSnapshot.name,
      reportSnapshot.storageProvider,
      reportSnapshot.uri,
    );
  }
}
