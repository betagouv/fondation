import { Id, makeId } from '../../../utils/id';
import { ReportFileUsageEnum } from '../../shared/report-file-usage.enum';
import { ReportStateEnum } from '../../shared/report-state.enum';

export class ReportFilesAttached {
  constructor(
    readonly id: string,
    readonly reporterId: string,
    readonly usage: ReportFileUsageEnum,
    readonly files: readonly { id: string }[],
  ) {}
}

export class ReportAttachmentDetached {
  constructor(
    readonly id: string,
    readonly fileId: string,
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

type ReportEvent =
  | ReportFilesAttached
  | ReportAttachmentDetached
  | ReportUpdated
  | ReportRuleValidationUpdated;

export class Report {
  private constructor(readonly id: Id<'ReportId'>) {}

  static from(props: { id: string }): Report {
    return new Report(makeId('ReportId', props.id));
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

  /** by its id, two attachments of a report may share a name */
  detachAttachment(command: { fileId: string }) {
    this.#messages.push(new ReportAttachmentDetached(this.id, command.fileId));
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
