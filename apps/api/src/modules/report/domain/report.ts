import { ReportFileUsageEnum } from 'src/modules/shared/report-file-usage.enum';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';
import { Id, makeId } from 'src/utils/id';

export class ReportFilesAttached {
  constructor(
    readonly id: string,
    readonly reporterId: string,
    readonly usage: ReportFileUsageEnum,
    readonly files: readonly { id: string }[],
  ) {}
}

export class ReportFilesDetached {
  constructor(
    readonly id: string,
    readonly reporterId: string,
    readonly fileNames: readonly string[],
  ) {}
}

export class ReportUpdated {
  constructor(
    readonly id: string,
    readonly data: {
      status: ReportStateEnum | undefined;
      comment: string | undefined;
    },
  ) {}
}

export class ReportRuleValidationUpdated {
  constructor(
    readonly id: string,
    readonly ruleId: string,
    readonly isValidated: boolean,
  ) {}
}

type ReportEvent = ReportFilesAttached | ReportFilesDetached | ReportUpdated | ReportRuleValidationUpdated;

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
    fileUsage: ReportFileUsageEnum;
    files: readonly { id: string }[];
  }): void {
    if (command.files.length === 0) return;

    this.#messages.push(
      new ReportFilesAttached(this.id, command.reporterId, command.fileUsage, command.files),
    );
  }

  detachFiles(command: { reporterId: string; fileNames: readonly string[] }) {
    if (command.fileNames.length === 0) return;

    this.#messages.push(new ReportFilesDetached(this.id, command.reporterId, command.fileNames));
  }

  update(command: {
    data: {
      status: ReportStateEnum | undefined;
      comment: string | undefined;
    };
  }) {
    this.#messages.push(new ReportUpdated(this.id, command.data));
  }

  updateRuleValidation(command: { ruleId: string; isValidated: boolean }) {
    this.#messages.push(new ReportRuleValidationUpdated(this.id, command.ruleId, command.isValidated));
  }

  readonly #messages: ReportEvent[] = [];
  get messages(): readonly ReportEvent[] {
    return this.#messages;
  }
}
