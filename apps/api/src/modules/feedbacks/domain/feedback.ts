import { makeId } from '../../../utils/id';

export const FEEDBACK_STATUSES = ['NEW', 'ACKNOWLEDGED', 'PROCESSED', 'DISMISSED'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export class FeedbackSent {
  constructor(
    readonly feedbackId: string,
    readonly authorId: string,
    readonly impersonatedId: string | null,
    readonly text: string,
    readonly url: string,
  ) {}
}

export type FeedbackStatusWithComment = { comment: string | null; value: FeedbackStatus };

export class FeedbackStatusChanged {
  constructor(
    readonly feedbackId: string,
    readonly status: FeedbackStatusWithComment,
    readonly changedBy: string,
  ) {}
}

export type FeedbackEvent = FeedbackSent | FeedbackStatusChanged;

export class Feedback {
  readonly #messages: FeedbackEvent[] = [];

  private constructor(
    readonly id: string,
    private status: FeedbackStatusWithComment,
  ) {}

  get messages(): readonly FeedbackEvent[] {
    return this.#messages;
  }

  static from(props: { id: string; status: FeedbackStatusWithComment }): Feedback {
    return new Feedback(props.id, props.status);
  }

  // an admin viewing the application as someone speaks for themself: the account viewed is only the context
  static send(command: {
    sender: { id: string; impersonatorId: string | null };
    text: string;
    url: string;
  }): Feedback {
    const feedback = new Feedback(makeId(), { comment: null, value: 'NEW' });
    const { id, impersonatorId } = command.sender;
    feedback.#messages.push(
      impersonatorId
        ? new FeedbackSent(feedback.id, impersonatorId, id, command.text, command.url)
        : new FeedbackSent(feedback.id, id, null, command.text, command.url),
    );
    return feedback;
  }

  changeStatus(command: { changedBy: string; status: FeedbackStatusWithComment }): void {
    const { status } = command;
    if (status.value === this.status.value && status.comment === this.status.comment) return;

    this.status = status;
    this.#messages.push(new FeedbackStatusChanged(this.id, status, command.changedBy));
  }
}
