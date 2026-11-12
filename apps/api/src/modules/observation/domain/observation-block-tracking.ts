export const OBSERVATION_BLOCK_TRACKING_STATUSES = ['IN_PROGRESS', 'DONE'] as const;
export type ObservationBlockTrackingStatus = (typeof OBSERVATION_BLOCK_TRACKING_STATUSES)[number];

// a bloc without any tracking yet reads as in progress
export const UNTRACKED_BLOCK = { comment: null, status: 'IN_PROGRESS' } as const;

export class ObservationBlockTracked {
  constructor(
    readonly sessionId: string,
    readonly magistratId: string,
    readonly status: ObservationBlockTrackingStatus,
    readonly comment: string | null,
  ) {}
}

// the observations of one observant in one session share one tracking, kept once the session is archived
export class ObservationBlock {
  readonly #messages: ObservationBlockTracked[] = [];

  private constructor(
    readonly sessionId: string,
    readonly magistratId: string,
  ) {}

  get messages(): readonly ObservationBlockTracked[] {
    return this.#messages;
  }

  static from(props: { magistratId: string; sessionId: string }): ObservationBlock {
    return new ObservationBlock(props.sessionId, props.magistratId);
  }

  track(command: { comment: string | null; status: ObservationBlockTrackingStatus }): void {
    this.#messages.push(
      new ObservationBlockTracked(
        this.sessionId,
        this.magistratId,
        command.status,
        command.comment?.trim() || null,
      ),
    );
  }
}
