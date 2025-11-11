import { ReportFileUsage } from 'shared-models';
import { FileMimeType, FondationFile } from 'src/modules/framework/files';
import { Id, makeId } from 'src/utils/id';

export class ReportFilesAttached {
  constructor(
    readonly id: string,
    readonly reporterId: string,
    readonly usage: ReportFileUsage,
    readonly files: readonly FondationFile[],
  ) {}
}

export class ReportFilesDetached {
  constructor(
    readonly id: string,
    readonly reporterId: string,
    readonly fileNames: readonly string[],
  ) {}
}

type ReportEvent = ReportFilesAttached | ReportFilesDetached;

export class Report {
  private constructor(
    readonly id: Id<'ReportId'>,
    readonly sessionName: string,
    readonly nomAspirant: string,
    readonly reporterFullName: string,
  ) {}

  static from(props: {
    id: string;
    sessionName: string;
    nomAspirant: string;
    reporterFullName: string;
  }): Report {
    return new Report(
      makeId('ReportId', props.id),
      props.sessionName,
      props.nomAspirant,
      props.reporterFullName,
    );
  }

  attachFiles(command: {
    reporterId: string;
    fileUsage: ReportFileUsage;
    files: readonly { name: string; buffer: Buffer; type: FileMimeType }[];
  }): void {
    if (command.files.length === 0) return;

    this.#messages.push(
      new ReportFilesAttached(
        this.id,
        command.reporterId,
        command.fileUsage,
        command.files.map((file) => ({
          meta: { id: makeId('FileId'), fileUsage: command.fileUsage },
          buffer: file.buffer,
          mimeType: file.type,
          path: [
            this.sessionName,
            this.nomAspirant,
            this.reporterFullName,
            file.name,
          ].join('/'),
        })),
      ),
    );
  }

  detachFiles(command: { reporterId: string; fileNames: readonly string[] }) {
    if (command.fileNames.length === 0) return;

    this.#messages.push(
      new ReportFilesDetached(this.id, command.reporterId, command.fileNames),
    );
  }

  readonly #messages: ReportEvent[] = [];
  get messages(): readonly ReportEvent[] {
    return this.#messages;
  }
}
