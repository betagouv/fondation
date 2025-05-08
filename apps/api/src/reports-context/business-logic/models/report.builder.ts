import _ from 'lodash';
import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
} from 'shared-models';
import { Get, Paths } from 'type-fest';
import { NominationFileReportSnapshot } from './nomination-file-report';

export class ReportBuilder {
  private _snapshot: NominationFileReportSnapshot;

  constructor(idMode: 'fake' | 'uuid' = 'fake') {
    const isFakeId = idMode === 'fake';

    this._snapshot = {
      id: isFakeId ? 'report-id' : 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      dossierDeNominationId: isFakeId
        ? 'nomination-file-id'
        : 'ca1619e2-263d-49b6-b928-6a04ee681138',
      sessionId: isFakeId
        ? 'session-id'
        : '7d0536f8-0539-4106-ae88-672f4af245c1',
      createdAt: new Date(2021, 1, 1),
      reporterId: isFakeId
        ? 'reporter-id'
        : 'bc2588b6-fcd9-46d1-9baf-306dd0704015',
      version: 0,
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.SIEGE,
      comment: 'my comment',
      attachedFiles: null,
    };
  }

  with<
    K extends Paths<NominationFileReportSnapshot>,
    V extends Get<NominationFileReportSnapshot, K> = Get<
      NominationFileReportSnapshot,
      K
    >,
  >(property: K, value: V) {
    this._snapshot = _.set(this._snapshot, property, value);
    return this;
  }

  incrementVersion() {
    this._snapshot.version++;
    return this;
  }

  build(): NominationFileReportSnapshot {
    return this._snapshot;
  }

  static forUpdate(idMode: 'fake' | 'uuid' = 'fake'): ReportBuilder {
    return new ReportBuilder(idMode).with('version', 1);
  }

  static fromListingVM(reportListingVM: ReportListItemVM): ReportBuilder {
    return new ReportBuilder()
      .with('id', reportListingVM.id)
      .with('state', reportListingVM.state)
      .with('formation', reportListingVM.formation);
  }
  static fromRetrievalVM(reportRetrievalVM: ReportRetrievalVM): ReportBuilder {
    return new ReportBuilder()
      .with('id', reportRetrievalVM.id)
      .with('state', reportRetrievalVM.state)
      .with('formation', reportRetrievalVM.formation)
      .with('comment', reportRetrievalVM.comment);
  }

  static duplicateReport(report: NominationFileReportSnapshot): ReportBuilder {
    return new ReportBuilder()
      .with('id', report.id)
      .with('dossierDeNominationId', report.dossierDeNominationId)
      .with('reporterId', report.reporterId)
      .with('version', report.version)
      .with('state', report.state)
      .with('formation', report.formation)
      .with('comment', report.comment);
  }
}
