import { makeId } from '../../../utils/id';

export const REMARK_STATUSES = ['NEW', 'ACKNOWLEDGED', 'PROCESSED', 'DISMISSED'] as const;
export type RemarkStatus = (typeof REMARK_STATUSES)[number];

export class RemarkSent {
  constructor(
    readonly remarkId: string,
    readonly authorId: string,
    readonly impersonatedId: string | null,
    readonly text: string,
    readonly url: string,
  ) {}
}

export type RemarkStatusWithComment = { comment: string | null; value: RemarkStatus };

export class RemarkStatusChanged {
  constructor(
    readonly remarkId: string,
    readonly status: RemarkStatusWithComment,
    readonly changedBy: string,
  ) {}
}

export type RemarkEvent = RemarkSent | RemarkStatusChanged;

export class Remark {
  readonly #messages: RemarkEvent[] = [];

  private constructor(
    readonly id: string,
    private status: RemarkStatusWithComment,
  ) {}

  get messages(): readonly RemarkEvent[] {
    return this.#messages;
  }

  static from(props: { id: string; status: RemarkStatusWithComment }): Remark {
    return new Remark(props.id, props.status);
  }

  // an admin viewing the application as someone speaks for themself: the account viewed is only the context
  static send(command: {
    sender: { id: string; impersonatorId: string | null };
    text: string;
    url: string;
  }): Remark {
    const remark = new Remark(makeId(), { comment: null, value: 'NEW' });
    const { id, impersonatorId } = command.sender;
    remark.#messages.push(
      impersonatorId
        ? new RemarkSent(remark.id, impersonatorId, id, command.text, command.url)
        : new RemarkSent(remark.id, id, null, command.text, command.url),
    );
    return remark;
  }

  changeStatus(command: { changedBy: string; status: RemarkStatusWithComment }): void {
    // a remark back to new awaits its treatment again: there is nothing to comment yet
    const status = command.status.value === 'NEW' ? { comment: null, value: 'NEW' as const } : command.status;
    if (status.value === this.status.value && status.comment === this.status.comment) return;

    this.status = status;
    this.#messages.push(new RemarkStatusChanged(this.id, status, command.changedBy));
  }
}
