import { isDefined } from 'src/utils/is-defined';

const NOMINATION_FILE_OUTCOMES = [
  'VALIDATED',
  'NON_VALIDATED',
  'SUSPENDED',
  'REMOVED',
  'WITHDRAWN',
] as const;

export type NominationFileOutcomeEnum =
  (typeof NOMINATION_FILE_OUTCOMES)[number];

export class NominationFileOutcome {
  /** @internal exposed for DTOs definitions  */
  static readonly enum = NOMINATION_FILE_OUTCOMES;

  private constructor(
    readonly outcome: NominationFileOutcomeEnum,
    readonly comment: string | null,
  ) {}

  static from(props: {
    outcome: string;
    comment: string | null;
  }): NominationFileOutcome {
    const outcome = this.assertIsNominationFileOutcome(props.outcome);
    const comment = this.assertRequiredComment({
      outcome,
      comment: props.comment,
    });

    return new NominationFileOutcome(outcome, comment);
  }

  static assertIsNominationFileOutcome(value: any): NominationFileOutcomeEnum {
    if (!NOMINATION_FILE_OUTCOMES.includes(value)) {
      throw new UnknownNominationFileOutcome(value);
    }

    return value;
  }

  private static assertRequiredComment(props: {
    outcome: NominationFileOutcomeEnum;
    comment: string | null;
  }): string | null {
    const comment = props.comment?.trim() || null;
    if (props.outcome === 'NON_VALIDATED' && !isDefined(comment)) {
      throw new NominationFileOutcomeRequiresComment(props.outcome);
    }

    return comment;
  }
}

export class UnknownNominationFileOutcome extends Error {
  constructor(readonly outcome: string) {
    super();
  }
}

export class NominationFileOutcomeRequiresComment extends Error {
  constructor(readonly outcome: NominationFileOutcomeEnum) {
    super();
  }
}
