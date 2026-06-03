import { Magistrat } from 'shared-models';

import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';

const NOMINATION_FILE_OUTCOMES = [
  'VALIDATED',
  'NON_VALIDATED',
  'SUSPENDED',
  'REMOVED',
  'WITHDRAWN',
  'ASSESSING',
  'WAITING_DSJ',
] as const;

export type NominationFileOutcomeEnum = (typeof NOMINATION_FILE_OUTCOMES)[number];

export type NonFinalNominationFileOutcomeEnum = Extract<
  NominationFileOutcomeEnum,
  'SUSPENDED' | 'WAITING_DSJ' | 'ASSESSING'
>;

export type FinalNominationFileOutcomeEnum = Exclude<
  NominationFileOutcomeEnum,
  NonFinalNominationFileOutcomeEnum
>;

const NON_FINAL_OUTCOMES = Object.freeze(
  Object.values({
    ASSESSING: 'ASSESSING',
    SUSPENDED: 'SUSPENDED',
    WAITING_DSJ: 'WAITING_DSJ',
  } satisfies { [K in NonFinalNominationFileOutcomeEnum]: K }),
);

const FINAL_OUTCOMES = Object.freeze(
  NOMINATION_FILE_OUTCOMES.filter(
    (x): x is FinalNominationFileOutcomeEnum => !(NON_FINAL_OUTCOMES as unknown[]).includes(x),
  ),
);

export class NominationFileOutcome {
  /** @internal exposed for DTOs definitions  */
  static readonly enum = NOMINATION_FILE_OUTCOMES;

  static finalOutcomes(): FinalNominationFileOutcomeEnum[] {
    return [...FINAL_OUTCOMES];
  }

  static nonFinalOutcomes(): NonFinalNominationFileOutcomeEnum[] {
    return [...NON_FINAL_OUTCOMES];
  }

  private constructor(
    readonly outcome: NominationFileOutcomeEnum,
    readonly comment: string | null,
  ) {}

  static from(props: { outcome: string; comment: string | null }): NominationFileOutcome {
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

export function nominationFileOutcomeLabel(props: {
  outcome: NominationFileOutcomeEnum;
  formation: Magistrat.Formation;
}): string {
  switch (props.outcome) {
    case 'VALIDATED': {
      switch (props.formation) {
        case Magistrat.Formation.PARQUET:
          return 'avis favorable';
        case Magistrat.Formation.SIEGE:
          return 'avis conforme';
        default:
          return assertNever(props.formation);
      }
    }

    case 'NON_VALIDATED': {
      switch (props.formation) {
        case Magistrat.Formation.PARQUET:
          return 'avis défavorable';
        case Magistrat.Formation.SIEGE:
          return 'avis non conforme';
        default:
          return assertNever(props.formation);
      }
    }

    case 'SUSPENDED':
      return 'sursis à statuer';

    case 'REMOVED':
      return 'retrait';

    case 'WITHDRAWN':
      return 'retrait (désistement)';

    case 'ASSESSING':
      return 'en attente évaluation';

    case 'WAITING_DSJ':
      return 'en attente complément DSJ';

    default:
      return assertNever(props.outcome);
  }
}
