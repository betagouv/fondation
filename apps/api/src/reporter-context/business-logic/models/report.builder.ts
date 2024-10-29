import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  Transparency,
} from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFileReport } from './nomination-file-report';

export class ReportBuilder {
  private id: string;
  private createdAt: Date;
  private biography: string | null;
  private dueDate: DateOnly | null;
  private name: string;
  private birthDate: DateOnly;
  private state: NominationFile.ReportState;
  private formation: Magistrat.Formation;
  private transparency: Transparency;
  private grade: Magistrat.Grade;
  private currentPosition: string;
  private targettedPosition: string;
  private comment: string | null;
  private rank: string;
  private reporterName: string | null;

  constructor() {
    this.id = 'report-id';
    this.createdAt = new Date(2021, 1, 1);
    this.name = 'John Doe';
    this.biography = 'Biography';
    this.dueDate = new DateOnly(2030, 1, 1);
    this.birthDate = new DateOnly(1980, 1, 1);
    this.state = NominationFile.ReportState.NEW;
    this.formation = Magistrat.Formation.SIEGE;
    this.transparency = Transparency.MARCH_2025;
    this.grade = Magistrat.Grade.I;
    this.currentPosition = 'Procureur TJ -Lyon';
    this.targettedPosition = 'Juge TJ -Marseille';
    this.comment = 'my comment';
    this.rank = '(2 sur une liste de 100)';
    this.reporterName = 'EMILIEN Denis';
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }
  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }
  withName(name: string) {
    this.name = name;
    return this;
  }
  withReporterName(reporterName: string | null) {
    this.reporterName = reporterName;
    return this;
  }
  withBiography(biography: string | null) {
    this.biography = biography;
    return this;
  }
  withDueDate(dueDate: DateOnly | null) {
    this.dueDate = dueDate;
    return this;
  }
  withBirthDate(birthDate: DateOnly) {
    this.birthDate = birthDate;
    return this;
  }
  withFormation(formation: Magistrat.Formation) {
    this.formation = formation;
    return this;
  }
  withState(state: NominationFile.ReportState) {
    this.state = state;
    return this;
  }
  withGrade(grade: Magistrat.Grade) {
    this.grade = grade;
    return this;
  }
  withTransparency(transparency: Transparency) {
    this.transparency = transparency;
    return this;
  }
  withTargettedPosition(targettedPosition: string) {
    this.targettedPosition = targettedPosition;
    return this;
  }
  withCurrentPosition(currentPosition: string) {
    this.currentPosition = currentPosition;
    return this;
  }

  withComment(comment: string | null) {
    this.comment = comment;
    return this;
  }
  withRank(rank: string) {
    this.rank = rank;
    return this;
  }

  build(): NominationFileReport {
    return {
      id: this.id,
      createdAt: this.createdAt,
      name: this.name,
      reporterName: this.reporterName,
      biography: this.biography,
      dueDate: this.dueDate,
      birthDate: this.birthDate,
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      currentPosition: this.currentPosition,
      targettedPosition: this.targettedPosition,
      comment: this.comment,
      rank: this.rank,
    };
  }

  static fromListingVM(reportListingVM: ReportListItemVM): ReportBuilder {
    return new ReportBuilder()
      .withId(reportListingVM.id)
      .withState(reportListingVM.state)
      .withDueDate(
        reportListingVM.dueDate
          ? new DateOnly(
              reportListingVM.dueDate.year,
              reportListingVM.dueDate.month,
              reportListingVM.dueDate.day,
            )
          : null,
      )
      .withFormation(reportListingVM.formation)
      .withName(reportListingVM.name)
      .withReporterName(reportListingVM.reporterName)
      .withTransparency(reportListingVM.transparency)
      .withGrade(reportListingVM.grade)
      .withTargettedPosition(reportListingVM.targettedPosition);
  }
  static fromRetrievalVM(reportRetrievalVM: ReportRetrievalVM): ReportBuilder {
    return new ReportBuilder()
      .withId(reportRetrievalVM.id)
      .withBiography(reportRetrievalVM.biography)
      .withState(reportRetrievalVM.state)
      .withDueDate(
        reportRetrievalVM.dueDate
          ? new DateOnly(
              reportRetrievalVM.dueDate.year,
              reportRetrievalVM.dueDate.month,
              reportRetrievalVM.dueDate.day,
            )
          : null,
      )
      .withBirthDate(
        new DateOnly(
          reportRetrievalVM.birthDate.year,
          reportRetrievalVM.birthDate.month,
          reportRetrievalVM.birthDate.day,
        ),
      )
      .withFormation(reportRetrievalVM.formation)
      .withName(reportRetrievalVM.name)
      .withTransparency(reportRetrievalVM.transparency)
      .withGrade(reportRetrievalVM.grade)
      .withCurrentPosition(reportRetrievalVM.currentPosition)
      .withTargettedPosition(reportRetrievalVM.targettedPosition)
      .withComment(reportRetrievalVM.comment)
      .withRank(reportRetrievalVM.rank);
  }
}
