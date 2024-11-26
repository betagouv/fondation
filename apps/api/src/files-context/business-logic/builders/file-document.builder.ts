import _ from 'lodash';
import { Get, Paths } from 'type-fest';
import { FileDocumentSnapshot } from '../models/file-document';
import { FilesStorageProvider } from '../models/files-provider.enum';

export class FileDocumentBuilder {
  private _snapshot: FileDocumentSnapshot;

  constructor() {
    this._snapshot = {
      id: 'file-id',
      createdAt: new Date(2025, 5, 5),
      name: 'file-name',
      path: null,
      storageProvider: FilesStorageProvider.OUTSCALE,
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
      path: this._snapshot.path,
      storageProvider: this._snapshot.storageProvider,
    };
  }
}
