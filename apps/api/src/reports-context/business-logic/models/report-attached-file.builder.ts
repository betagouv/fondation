import _ from 'lodash';
import { Get, Paths } from 'type-fest';
import { ReportAttachedFileSnapshot } from './report-attached-file';

export class ReportAttachedFileBuilder {
  private _snapshot: ReportAttachedFileSnapshot;

  constructor() {
    this._snapshot = {
      name: 'some-file.pdf',
      fileId: 'file-id',
    };
  }

  with<
    K extends Paths<ReportAttachedFileSnapshot>,
    V extends Get<ReportAttachedFileSnapshot, K> = Get<
      ReportAttachedFileSnapshot,
      K
    >,
  >(property: K, value: V) {
    this._snapshot = _.set(this._snapshot, property, value);
    return this;
  }

  build(): ReportAttachedFileSnapshot {
    return this._snapshot;
  }
}
