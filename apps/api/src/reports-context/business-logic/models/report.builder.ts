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

  constructor() {
    this._snapshot = {
      id: 'report-id',
      nominationFileId: 'nomination-file-id',
      createdAt: new Date(2021, 1, 1),
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
      reporterName: 'EMILIEN Denis',
      observers: ['default observer'],
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
      .with('reporterName', reportListingVM.reporterName)
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
}
