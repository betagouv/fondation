import _ from 'lodash';
import { Get, Paths } from 'type-fest';
import { ReportAttachedFileSnapshot } from './report-attached-file';

export class ReportAttachedFileBuilder {
  private _snapshot: ReportAttachedFileSnapshot;

  constructor(idMode: 'fake' | 'uuid' = 'fake') {
    const isFakeId = idMode === 'fake';

    this._snapshot = {
      createdAt: new Date(2021, 1, 1),
      reportId: isFakeId ? 'report-id' : 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
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
