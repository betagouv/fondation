const OBSERVATION_FOLLOW_UPS = ['REFERENCE', 'ALERT', 'INTERESTING'] as const;
export type ObservationFollowUpEnum = (typeof OBSERVATION_FOLLOW_UPS)[number];

export class ObservationFollowUp {
  static enum = OBSERVATION_FOLLOW_UPS;

  private constructor(
    readonly status: ObservationFollowUpEnum,
    readonly comment: string | null,
  ) {}

  static from(props: { followUp: string; comment: string | null }) {
    const status = this.assertIsFollowUp(props.followUp);
    const comment = this.assertIsFollowUpComment(status, props.comment);

    return new ObservationFollowUp(status, comment);
  }

  private static assertIsFollowUpComment(
    status: ObservationFollowUpEnum,
    value: string | null,
  ): string | null {
    const trimmed = value?.trim() || null;
    if (status === 'INTERESTING' && !trimmed) {
      throw new ObservationFollowUpRequiresComment(status);
    }

    return trimmed;
  }

  private static assertIsFollowUp(value: string): ObservationFollowUpEnum {
    if (!OBSERVATION_FOLLOW_UPS.includes(value as any)) {
      throw new UnknownObservationFollowUp(value);
    }

    return value as ObservationFollowUpEnum;
  }
}

export class UnknownObservationFollowUp extends Error {
  constructor(readonly followUp: string) {
    super();
  }
}

export class ObservationFollowUpRequiresComment extends Error {
  constructor(readonly followUp: ObservationFollowUpEnum) {
    super();
  }
}
