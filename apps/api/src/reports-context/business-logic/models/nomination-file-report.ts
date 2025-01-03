import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { ReportToCreate } from '../use-cases/report-creation/create-report.use-case';
import { ReportAttachedFile } from './report-attached-file';
import { ReportAttachedFiles } from './report-attached-files';

export type NominationFileReportSnapshot = {
  id: string;
  nominationFileId: string;
  createdAt: Date;
  folderNumber: number | null;
  biography: string | null;
  dueDate: DateOnly | null;
  name: string;
  reporterName: string | null;
  birthDate: DateOnly;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  transparency: Transparency;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  observers: string[] | null;
  attachedFiles: ReportAttachedFiles | null;
};

export class NominationFileReport {
  constructor(
    private readonly _id: string,
    readonly nominationFileId: string,
    readonly createdAt: Date,
    public folderNumber: number | null,
    readonly biography: string | null,
    readonly dueDate: DateOnly | null,
    readonly name: string,
    readonly reporterName: string | null,
    readonly birthDate: DateOnly,
    readonly state: NominationFile.ReportState,
    readonly formation: Magistrat.Formation,
    readonly transparency: Transparency,
    readonly grade: Magistrat.Grade,
    readonly currentPosition: string,
    readonly targettedPosition: string,
    readonly comment: string | null,
    readonly rank: string,
    public observers: string[] | null,
    readonly attachedFiles: ReportAttachedFiles | null,
  ) {}

  replaceFolderNumber(folderNumber: number | null) {
    this.folderNumber = folderNumber;
  }

  replaceObservers(observers: string[]) {
    this.observers = observers;
  }

  alreadyHasAttachedFile(file: ReportAttachedFile): boolean {
    return !!this.attachedFiles?.alreadyExists(file);
  }

  createAttachedFile(
    fileName: string,
    fileId: string,
    currentDate: Date,
  ): ReportAttachedFile {
    return new ReportAttachedFile(currentDate, this.id, fileName, fileId);
  }

  generateAttachedFilePath(): string[] {
    if (!this.reporterName) throw new Error('Reporter name is missing');
    return [this.transparency, this.name, this.reporterName];
  }

  public get id(): string {
    return this._id;
  }

  toSnapshot(): NominationFileReportSnapshot {
    return {
      id: this.id,
      nominationFileId: this.nominationFileId,
      createdAt: this.createdAt,
      folderNumber: this.folderNumber,
      biography: this.biography,
      dueDate: this.dueDate,
      name: this.name,
      reporterName: this.reporterName,
      birthDate: this.birthDate,
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      currentPosition: this.currentPosition,
      targettedPosition: this.targettedPosition,
      comment: this.comment,
      rank: this.rank,
      observers: this.observers,
      attachedFiles: this.attachedFiles,
    };
  }

  static fromSnapshot(
    snapshot: NominationFileReportSnapshot,
  ): NominationFileReport {
    return new NominationFileReport(
      snapshot.id,
      snapshot.nominationFileId,
      snapshot.createdAt,
      snapshot.folderNumber,
      snapshot.biography,
      snapshot.dueDate,
      snapshot.name,
      snapshot.reporterName,
      snapshot.birthDate,
      snapshot.state,
      snapshot.formation,
      snapshot.transparency,
      snapshot.grade,
      snapshot.currentPosition,
      snapshot.targettedPosition,
      snapshot.comment,
      snapshot.rank,
      snapshot.observers,
      snapshot.attachedFiles,
    );
  }

  static createFromImport(
    reportId: string,
    importedNominationFileId: string,
    createReportPayload: ReportToCreate,
    currentDate: Date,
  ): NominationFileReport {
    const report = new NominationFileReport(
      reportId,
      importedNominationFileId,
      currentDate,
      createReportPayload.folderNumber,
      createReportPayload.biography,
      createReportPayload.dueDate
        ? new DateOnly(
            createReportPayload.dueDate.year,
            createReportPayload.dueDate.month,
            createReportPayload.dueDate.day,
          )
        : null,
      createReportPayload.name,
      createReportPayload.reporterName,
      new DateOnly(
        createReportPayload.birthDate.year,
        createReportPayload.birthDate.month,
        createReportPayload.birthDate.day,
      ),
      createReportPayload.state,
      createReportPayload.formation,
      createReportPayload.transparency,
      createReportPayload.grade,
      createReportPayload.currentPosition,
      createReportPayload.targettedPosition,
      null,
      createReportPayload.rank,
      createReportPayload.observers,
      null,
    );

    return report;
  }
}
