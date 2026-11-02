import { makeId } from '../../../utils/id';

export const REMARK_STATUSES = ['NEW', 'PROCESSED', 'DISMISSED'] as const;
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

export class RemarkStatusChanged {
  constructor(
    readonly remarkId: string,
    readonly status: RemarkStatus,
    readonly changedBy: string,
  ) {}
}

export type RemarkEvent = RemarkSent | RemarkStatusChanged;

export class Remark {
  readonly #messages: RemarkEvent[] = [];

  private constructor(
    readonly id: string,
    private status: RemarkStatus,
  ) {}

  get messages(): readonly RemarkEvent[] {
    return this.#messages;
  }

  static from(props: { id: string; status: RemarkStatus }): Remark {
    return new Remark(props.id, props.status);
  }

  /** the changes come most recent first */
  static statusOf(changes: readonly { status: RemarkStatus }[]): RemarkStatus {
    return changes[0]?.status ?? 'NEW';
  }

  // an admin viewing the application as someone speaks for themself: the account viewed is only the context
  static send(command: {
    sender: { id: string; impersonatorId: string | null };
    text: string;
    url: string;
  }): Remark {
    const remark = new Remark(makeId(), 'NEW');
    const { id, impersonatorId } = command.sender;
    remark.#messages.push(
      impersonatorId
        ? new RemarkSent(remark.id, impersonatorId, id, command.text, command.url)
        : new RemarkSent(remark.id, id, null, command.text, command.url),
    );
    return remark;
  }

  changeStatus(command: { changedBy: string; status: RemarkStatus }): void {
    if (command.status === this.status) return;

    this.status = command.status;
    this.#messages.push(new RemarkStatusChanged(this.id, command.status, command.changedBy));
  }
}
