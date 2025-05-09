import { Magistrat, NominationFile, ReportFileUsage } from 'shared-models';
import { z } from 'zod';
import { DomainRegistry } from './domain-registry';
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from './report-attached-file';
import { ReportAttachedFiles } from './report-attached-files';
import { Reporter } from './reporter';
import { RapportTransparenceCrééEvent } from './events/rapport-transparence-créé.event';
import { DossierDeNomination } from './dossier-de-nomination';

export type NominationFileReportSnapshot = {
  id: string;
  dossierDeNominationId: string;
  sessionId: string;
  reporterId: string;
  version: number;
  createdAt: Date;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  comment: string | null;
  attachedFiles: ReportAttachedFileSnapshot[] | null;
};

export class NominationFileReport {
  constructor(
    private readonly _id: string,
    private readonly _dossierDeNominationId: string,
    private readonly _sessionId: string,
    private readonly _createdAt: Date,
    private readonly _reporterId: string,
    private _version: number,
    private _state: NominationFile.ReportState,
    private readonly _formation: Magistrat.Formation,
    private _comment: string | null,
    private _attachedFiles: ReportAttachedFiles | null,
  ) {}

  get dossierDeNominationId(): string {
    return this._dossierDeNominationId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get reporterId(): string {
    return this._reporterId;
  }

  get version(): number {
    return this._version;
  }
  private set version(value: number) {
    this._version = z.number().int().min(0).parse(value);
  }

  get state(): NominationFile.ReportState {
    return this._state;
  }
  private set state(value: NominationFile.ReportState) {
    this._state = z.nativeEnum(NominationFile.ReportState).parse(value);
  }

  get formation(): Magistrat.Formation {
    return this._formation;
  }

  get comment(): string | null {
    return this._comment;
  }
  private set comment(value: string | null) {
    this._comment = z.string().nullable().parse(value);
  }

  get attachedFiles(): ReportAttachedFiles | null {
    return this._attachedFiles;
  }

  updateComment(comment?: string | null) {
    this.comment = comment || null;
  }

  updateState(state: NominationFile.ReportState) {
    this.state = state;
  }

  createAttachedFile(
    fileName: string,
    usage: ReportFileUsage,
    fileId: string,
  ): ReportAttachedFile {
    const attachedFile = new ReportAttachedFile(fileName, fileId, usage);

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

  generateAttachedFilePath(
    reporter: Reporter,
    dossierDeNomination: DossierDeNomination,
  ): string[] {
    return [
      dossierDeNomination.sessionName,
      dossierDeNomination.nomAspirant,
      reporter.fullName.fullName(),
    ];
  }

  get id(): string {
    return this._id;
  }

  toSnapshot(): NominationFileReportSnapshot {
    return {
      id: this.id,
      dossierDeNominationId: this.dossierDeNominationId,
      sessionId: this._sessionId,
      reporterId: this.reporterId,
      version: this.version,
      createdAt: this.createdAt,
      state: this.state,
      formation: this.formation,
      comment: this.comment,
      attachedFiles: this.attachedFiles?.toSnapshot() || null,
    };
  }

  static fromSnapshot(
    snapshot: NominationFileReportSnapshot,
  ): NominationFileReport {
    return new NominationFileReport(
      snapshot.id,
      snapshot.dossierDeNominationId,
      snapshot.sessionId,
      snapshot.createdAt,
      snapshot.reporterId,
      snapshot.version,
      snapshot.state,
      snapshot.formation,
      snapshot.comment,
      snapshot.attachedFiles
        ? new ReportAttachedFiles(
            snapshot.attachedFiles.map(ReportAttachedFile.fromSnapshot),
          )
        : null,
    );
  }

  static createFromImport(
    sessionId: string,
    dossierDeNominationId: string,
    formation: Magistrat.Formation,
    reporterId: string,
  ): [NominationFileReport, RapportTransparenceCrééEvent] {
    const rapportId = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();

    const rapport = new NominationFileReport(
      rapportId,
      dossierDeNominationId,
      sessionId,
      currentDate,
      reporterId,
      0,
      NominationFile.ReportState.NEW,
      formation,
      null,
      null,
    );

    const rapportCrééEvent = RapportTransparenceCrééEvent.fromRapportSnapshot(
      rapport.toSnapshot(),
    );

    return [rapport, rapportCrééEvent];
  }
}
