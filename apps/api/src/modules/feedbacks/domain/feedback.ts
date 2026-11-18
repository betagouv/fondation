import { subDays, subMonths } from 'date-fns';

import { makeId } from '../../../utils/id';

export const FEEDBACK_STATUSES = ['NEW', 'ACKNOWLEDGED', 'PROCESSED', 'DISMISSED'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_AGES = [
  'MORE_THAN_7_DAYS',
  'MORE_THAN_14_DAYS',
  'MORE_THAN_21_DAYS',
  'MORE_THAN_1_MONTH',
  'MORE_THAN_2_MONTHS',
] as const;
export type FeedbackAge = (typeof FEEDBACK_AGES)[number];

export function sentBefore(age: FeedbackAge, now: Date): Date {
  switch (age) {
    case 'MORE_THAN_7_DAYS':
      return subDays(now, 7);
    case 'MORE_THAN_14_DAYS':
      return subDays(now, 14);
    case 'MORE_THAN_21_DAYS':
      return subDays(now, 21);
    case 'MORE_THAN_1_MONTH':
      return subMonths(now, 1);
    case 'MORE_THAN_2_MONTHS':
      return subMonths(now, 2);
  }
}

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
