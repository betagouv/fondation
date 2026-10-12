import type { DateOnly } from 'src/utils/date-only';
import type { TimeOnly } from 'src/utils/time-only';

export class ObservantAuditionScheduled {
  constructor(
    readonly sessionId: string,
    readonly magistratId: string,
    readonly auditionDateTime: { date: DateOnly; time: TimeOnly },
    readonly userId: string,
    readonly impersonatorId: string | null,
  ) {}
}

export class ObservantAuditionUnscheduled {
  constructor(
    readonly sessionId: string,
    readonly magistratId: string,
    readonly userId: string,
    readonly impersonatorId: string | null,
  ) {}
}

export type ObservantAuditionEvent = ObservantAuditionScheduled | ObservantAuditionUnscheduled;

export const UNSCHEDULABLE_REASONS = ['FINAL_OUTCOME', 'LOCKED', 'NOT_IN_PROGRESS'] as const;
export type UnschedulableReason = (typeof UNSCHEDULABLE_REASONS)[number];

export class CannotScheduleObservantAudition extends Error {
  constructor(
    readonly magistratId: string,
    readonly reason: UnschedulableReason,
  ) {
    super();
  }
}

type ObservedNominationFile = { allowsAudition: boolean; isLocked: boolean };

// an observant is heard once per session, whatever the number of observations they made in it,
// as long as one of the nomination files they observed is still being processed
export class ObservantAudition {
  readonly #messages: ObservantAuditionEvent[] = [];

  private constructor(
    readonly sessionId: string,
    readonly magistratId: string,
    private readonly observedNominationFiles: readonly ObservedNominationFile[],
  ) {}

  get messages(): readonly ObservantAuditionEvent[] {
    return this.#messages;
  }

  static from(props: {
    magistratId: string;
    observedNominationFiles: readonly ObservedNominationFile[];
    sessionId: string;
  }): ObservantAudition {
    return new ObservantAudition(props.sessionId, props.magistratId, props.observedNominationFiles);
  }

  static unschedulableReason(files: readonly ObservedNominationFile[]): UnschedulableReason | null {
    if (files.some((file) => file.allowsAudition && !file.isLocked)) return null;
    if (files.every((file) => file.isLocked)) return 'LOCKED';
    if (files.every((file) => !file.allowsAudition)) return 'FINAL_OUTCOME';
    return 'NOT_IN_PROGRESS';
  }

  schedule(command: {
    auditionDateTime: { date: DateOnly; time: TimeOnly };
    impersonatorId: string | null;
    userId: string;
  }): void {
    const reason = ObservantAudition.unschedulableReason(this.observedNominationFiles);
    if (reason) throw new CannotScheduleObservantAudition(this.magistratId, reason);

    this.#messages.push(
      new ObservantAuditionScheduled(
        this.sessionId,
        this.magistratId,
        command.auditionDateTime,
        command.userId,
        command.impersonatorId,
      ),
    );
  }

  unschedule(command: { impersonatorId: string | null; userId: string }): void {
    this.#messages.push(
      new ObservantAuditionUnscheduled(
        this.sessionId,
        this.magistratId,
        command.userId,
        command.impersonatorId,
      ),
    );
  }
}
