import {
  Magistrat,
  NominationFile,
  ReportFileUsage,
  Transparency,
} from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';
import { ReportToCreate } from '../use-cases/report-creation/create-report.use-case';
import { DomainRegistry } from './domain-registry';
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from './report-attached-file';
import { ReportAttachedFiles } from './report-attached-files';
import { Reporter } from './reporter';

export type NominationFileReportSnapshot = {
  id: string;
  nominationFileId: string;
  reporterId: string;
  version: number;
  createdAt: Date;
  folderNumber: number | null;
  biography: string | null;
  dueDate: DateOnly | null;
  name: string;
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
  attachedFiles: ReportAttachedFileSnapshot[] | null;
};

export class NominationFileReport {
  constructor(
    private readonly _id: string,
    private readonly _nominationFileId: string,
    private readonly _createdAt: Date,
    private readonly _reporterId: string,
    private _version: number,
    private _folderNumber: number | null,
    private readonly _biography: string | null,
    private readonly _dueDate: DateOnly | null,
    private readonly _name: string,
    private readonly _birthDate: DateOnly,
    private _state: NominationFile.ReportState,
    private readonly _formation: Magistrat.Formation,
    private readonly _transparency: Transparency,
    private readonly _grade: Magistrat.Grade,
    private readonly _currentPosition: string,
    private readonly _targettedPosition: string,
    private _comment: string | null,
    private readonly _rank: string,
    private _observers: string[] | null,
    private _attachedFiles: ReportAttachedFiles | null,
  ) {}

  public get nominationFileId(): string {
    return this._nominationFileId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get reporterId(): string {
    return this._reporterId;
  }

  public get version(): number {
    return this._version;
  }
  private set version(value: number) {
    this._version = z.number().int().min(0).parse(value);
  }

  public get folderNumber(): number | null {
    return this._folderNumber;
  }
  private set folderNumber(value: number | null) {
    this._folderNumber = z.number().int().min(1).nullable().parse(value);
  }

  public get biography(): string | null {
    return this._biography;
  }

  public get dueDate(): DateOnly | null {
    return this._dueDate;
  }

  public get name(): string {
    return this._name;
  }

  public get birthDate(): DateOnly {
    return this._birthDate;
  }

  public get state(): NominationFile.ReportState {
    return this._state;
  }
  private set state(value: NominationFile.ReportState) {
    this._state = z.nativeEnum(NominationFile.ReportState).parse(value);
  }

  public get formation(): Magistrat.Formation {
    return this._formation;
  }

  public get transparency(): Transparency {
    return this._transparency;
  }

  public get grade(): Magistrat.Grade {
    return this._grade;
  }

  public get currentPosition(): string {
    return this._currentPosition;
  }

  public get targettedPosition(): string {
    return this._targettedPosition;
  }

  public get comment(): string | null {
    return this._comment;
  }
  private set comment(value: string | null) {
    this._comment = z.string().nullable().parse(value);
  }

  public get rank(): string {
    return this._rank;
  }

  public get observers(): string[] | null {
    return this._observers;
  }
  private set observers(value: string[] | null) {
    this._observers = z.array(z.string().min(3)).nullable().parse(value);
  }

  public get attachedFiles(): ReportAttachedFiles | null {
    return this._attachedFiles;
  }

  updateComment(comment?: string | null) {
    this.comment = comment || null;
  }

  updateState(state: NominationFile.ReportState) {
    this.state = state;
  }

  replaceFolderNumber(folderNumber: number | null) {
    this._folderNumber = folderNumber;
  }

  replaceObservers(observers: string[]) {
    this._observers = observers;
  }

  createAttachedFile(
    fileName: string,
    usage: ReportFileUsage,
  ): ReportAttachedFile {
    const attachedFile = new ReportAttachedFile(
      fileName,
      DomainRegistry.uuidGenerator().generate(),
      usage,
    );

    if (!this._attachedFiles) this._attachedFiles = new ReportAttachedFiles();
    if (!this.alreadyHasAttachedFile(attachedFile))
      this._attachedFiles.addFile(attachedFile);

    return attachedFile;
  }

  deleteAttachedFileByName(fileName: string) {
    if (!this.attachedFiles) {
      throw new Error('No attached files');
    }
    const [attachedFiles, removedAttachedFile] =
      this.attachedFiles.removeFileByName(fileName);

    this._attachedFiles = attachedFiles;

    return removedAttachedFile;
  }

  deleteAttachedFilesByNames(fileNames: string[]) {
    if (!this.attachedFiles) {
      throw new Error('No attached files');
    }

    const [attachedFiles, deletedFiles] =
      this.attachedFiles.removeFilesByNames(fileNames);
    this._attachedFiles = attachedFiles;

    return deletedFiles;
  }

  alreadyHasAttachedFile(file: ReportAttachedFile): boolean {
    return !!this.attachedFiles?.alreadyExists(file);
  }

  generateAttachedFilePath(reporter: Reporter): string[] {
    return [this.transparency, this.name, reporter.fullName.fullName()];
  }

  public get id(): string {
    return this._id;
  }

  toSnapshot(): NominationFileReportSnapshot {
    return {
      id: this.id,
      nominationFileId: this.nominationFileId,
      reporterId: this.reporterId,
      version: this.version,
      createdAt: this.createdAt,
      folderNumber: this.folderNumber,
      biography: this.biography,
      dueDate: this.dueDate,
      name: this.name,
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
      attachedFiles: this.attachedFiles?.toSnapshot() || null,
    };
  }

  static fromSnapshot(
    snapshot: NominationFileReportSnapshot,
  ): NominationFileReport {
    return new NominationFileReport(
      snapshot.id,
      snapshot.nominationFileId,
      snapshot.createdAt,
      snapshot.reporterId,
      snapshot.version,
      snapshot.folderNumber,
      snapshot.biography,
      snapshot.dueDate,
      snapshot.name,
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
      snapshot.attachedFiles
        ? new ReportAttachedFiles(
            snapshot.attachedFiles.map(ReportAttachedFile.fromSnapshot),
          )
        : null,
    );
  }

  static createFromImport(
    importedNominationFileId: string,
    createReportPayload: ReportToCreate,
    reporter: Reporter,
  ): NominationFileReport {
    const reportId = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();

    const report = new NominationFileReport(
      reportId,
      importedNominationFileId,
      currentDate,
      reporter.reporterId,
      0,
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
      new DateOnly(
        createReportPayload.birthDate.year,
        createReportPayload.birthDate.month,
        createReportPayload.birthDate.day,
      ),
      NominationFile.ReportState.NEW,
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
