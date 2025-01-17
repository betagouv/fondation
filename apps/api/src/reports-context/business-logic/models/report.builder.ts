import _ from 'lodash';
import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  Transparency,
} from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { Get, Paths } from 'type-fest';
import { NominationFileReportSnapshot } from './nomination-file-report';

export class ReportBuilder {
  private _snapshot: NominationFileReportSnapshot;

  constructor(idMode: 'fake' | 'uuid' = 'fake') {
    const isFakeId = idMode === 'fake';

    this._snapshot = {
      id: isFakeId ? 'report-id' : 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      nominationFileId: isFakeId
        ? 'nomination-file-id'
        : 'ca1619e2-263d-49b6-b928-6a04ee681138',
      createdAt: new Date(2021, 1, 1),
      reporterId: isFakeId
        ? 'reporter-id'
        : 'bc2588b6-fcd9-46d1-9baf-306dd0704015',
      folderNumber: 1,
      name: 'John Doe',
      biography: 'Biography',
      dueDate: new DateOnly(2030, 1, 1),
      birthDate: new DateOnly(1980, 1, 1),
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.SIEGE,
      transparency: Transparency.MARCH_2025,
      grade: Magistrat.Grade.I,
      currentPosition: 'Procureur TJ -Lyon',
      targettedPosition: 'Juge TJ -Marseille',
      comment: 'my comment',
      rank: '(2 sur une liste de 100)',
      observers: ['default observer'],
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

  build(): NominationFileReportSnapshot {
    return this._snapshot;
  }

  static fromListingVM(reportListingVM: ReportListItemVM): ReportBuilder {
    return new ReportBuilder()
      .with('id', reportListingVM.id)
      .with('folderNumber', reportListingVM.folderNumber)
      .with('state', reportListingVM.state)
      .with(
        'dueDate',
        reportListingVM.dueDate
          ? new DateOnly(
              reportListingVM.dueDate.year,
              reportListingVM.dueDate.month,
              reportListingVM.dueDate.day,
            )
          : null,
      )
      .with('formation', reportListingVM.formation)
      .with('name', reportListingVM.name)
      .with('transparency', reportListingVM.transparency)
      .with('grade', reportListingVM.grade)
      .with('targettedPosition', reportListingVM.targettedPosition);
  }
  static fromRetrievalVM(reportRetrievalVM: ReportRetrievalVM): ReportBuilder {
    return new ReportBuilder()
      .with('id', reportRetrievalVM.id)
      .with('biography', reportRetrievalVM.biography)
      .with('state', reportRetrievalVM.state)
      .with(
        'dueDate',
        reportRetrievalVM.dueDate
          ? new DateOnly(
              reportRetrievalVM.dueDate.year,
              reportRetrievalVM.dueDate.month,
              reportRetrievalVM.dueDate.day,
            )
          : null,
      )
      .with(
        'birthDate',
        new DateOnly(
          reportRetrievalVM.birthDate.year,
          reportRetrievalVM.birthDate.month,
          reportRetrievalVM.birthDate.day,
        ),
      )
      .with('formation', reportRetrievalVM.formation)
      .with('name', reportRetrievalVM.name)
      .with('transparency', reportRetrievalVM.transparency)
      .with('grade', reportRetrievalVM.grade)
      .with('currentPosition', reportRetrievalVM.currentPosition)
      .with('targettedPosition', reportRetrievalVM.targettedPosition)
      .with('comment', reportRetrievalVM.comment)
      .with('rank', reportRetrievalVM.rank)
      .with('observers', reportRetrievalVM.observers);
  }

  static duplicateReport(report: NominationFileReportSnapshot): ReportBuilder {
    return new ReportBuilder()
      .with('id', report.id)
      .with('nominationFileId', report.nominationFileId)
      .with('reporterId', report.reporterId)
      .with('folderNumber', report.folderNumber)
      .with('dueDate', report.dueDate)
      .with('birthDate', report.birthDate)
      .with('name', report.name)
      .with('state', report.state)
      .with('formation', report.formation)
      .with('transparency', report.transparency)
      .with('grade', report.grade)
      .with('currentPosition', report.currentPosition)
      .with('targettedPosition', report.targettedPosition)
      .with('comment', report.comment)
      .with('rank', report.rank)
      .with('observers', report.observers)
      .with('biography', report.biography);
  }
}
