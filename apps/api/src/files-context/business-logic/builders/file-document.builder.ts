import _ from 'lodash';
import { Get, Paths } from 'type-fest';
import { FileDocumentSnapshot } from '../models/file-document';
import { FilesStorageProvider } from '../models/files-provider.enum';

type IdMode = 'uuid' | 'fake';

export class FileDocumentBuilder {
  private _snapshot: FileDocumentSnapshot;

  constructor(idMode: IdMode = 'fake') {
    this._snapshot = {
      id:
        idMode === 'uuid' ? 'd40b7854-91ee-46a1-bc43-a903d3159e90' : 'file-id',
      createdAt: new Date(2025, 5, 5),
      name: 'file-name',
      bucket: 'fondation',
      path: null,
      storageProvider: FilesStorageProvider.SCALEWAY,
    };
  }

  with<
    K extends Paths<FileDocumentSnapshot>,
    V extends Get<FileDocumentSnapshot, K> = Get<FileDocumentSnapshot, K>,
  >(property: K, value: V) {
    if (!this._snapshot) throw new Error('No file document');
    this._snapshot = _.set(this._snapshot, property, value);
    return this;
  }

  build(): FileDocumentSnapshot {
    return {
      id: this._snapshot.id,
      createdAt: this._snapshot.createdAt,
      name: this._snapshot.name,
      bucket: this._snapshot.bucket,
      path: this._snapshot.path,
      signedUrl: this._snapshot.signedUrl,
      storageProvider: this._snapshot.storageProvider,
    };
  }

  static fromSnapshot(
    snapshot: FileDocumentSnapshot,
    idMode: IdMode = 'fake',
  ): FileDocumentBuilder {
    return new FileDocumentBuilder(idMode)
      .with('id', snapshot.id)
      .with('createdAt', snapshot.createdAt)
      .with('name', snapshot.name)
      .with('bucket', snapshot.bucket)
      .with('path', snapshot.path)
      .with('storageProvider', snapshot.storageProvider);
  }
}
