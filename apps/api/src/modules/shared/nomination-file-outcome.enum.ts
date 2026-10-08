import { FormationEnum } from 'src/modules/shared/formation.enum';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';

const NOMINATION_FILE_OUTCOMES = [
  'VALIDATED',
  'NON_VALIDATED',
  'SUSPENDED',
  'REMOVED',
  'WITHDRAWN',
  'WAITING_DSJ',
] as const;

export type NominationFileOutcomeEnum = (typeof NOMINATION_FILE_OUTCOMES)[number];

const NOMINATION_FILE_OUTCOME_STATUSES = ['FINAL', 'PENDING'] as const;

export type NominationFileOutcomeStatus = (typeof NOMINATION_FILE_OUTCOME_STATUSES)[number];

const NON_FINAL_OUTCOMES = [
  'SUSPENDED',
  'WAITING_DSJ',
] as const satisfies readonly NominationFileOutcomeEnum[];

export type NonFinalNominationFileOutcomeEnum = (typeof NON_FINAL_OUTCOMES)[number];

export type FinalNominationFileOutcomeEnum = Exclude<
  NominationFileOutcomeEnum,
  NonFinalNominationFileOutcomeEnum
>;

const FINAL_OUTCOMES = Object.freeze(
  NOMINATION_FILE_OUTCOMES.filter(
    (x): x is FinalNominationFileOutcomeEnum =>
      !(NON_FINAL_OUTCOMES as readonly NominationFileOutcomeEnum[]).includes(x),
  ),
);

const OUTCOMES_IN_SELECTION_ORDER = Object.freeze(
  Object.values({
    VALIDATED: 'VALIDATED',
    NON_VALIDATED: 'NON_VALIDATED',
    SUSPENDED: 'SUSPENDED',
    WAITING_DSJ: 'WAITING_DSJ',
    WITHDRAWN: 'WITHDRAWN',
    REMOVED: 'REMOVED',
  } satisfies { [K in NominationFileOutcomeEnum]: K }),
);

export type SelectableNominationFileOutcome = {
  commentRequired: boolean;
  label: string;
  value: NominationFileOutcomeEnum;
};

export class NominationFileOutcome {
  /** @internal exposed for DTOs definitions  */
  static readonly enum = NOMINATION_FILE_OUTCOMES;

  /** @internal exposed for DTOs definitions  */
  static readonly statuses = NOMINATION_FILE_OUTCOME_STATUSES;

  static finalOutcomes(): FinalNominationFileOutcomeEnum[] {
    return [...FINAL_OUTCOMES];
  }

  static nonFinalOutcomes(): NonFinalNominationFileOutcomeEnum[] {
    return [...NON_FINAL_OUTCOMES];
  }

  static statusOf(outcome: NominationFileOutcomeEnum): NominationFileOutcomeStatus {
    return (FINAL_OUTCOMES as readonly NominationFileOutcomeEnum[]).includes(outcome) ? 'FINAL' : 'PENDING';
  }

  static allowsAudition(outcome: NominationFileOutcomeEnum | null): boolean {
    return outcome === null || NominationFileOutcome.statusOf(outcome) === 'PENDING';
  }

  static commentRequired(outcome: NominationFileOutcomeEnum): boolean {
    return outcome === 'NON_VALIDATED';
  }

  static selectableOutcomes(formation: FormationEnum): SelectableNominationFileOutcome[] {
    return OUTCOMES_IN_SELECTION_ORDER.map((value) => ({
      commentRequired: NominationFileOutcome.commentRequired(value),
      label: nominationFileOutcomeLabel({ formation, outcome: value }),
      value,
    }));
  }

  private constructor(
    readonly outcome: NominationFileOutcomeEnum,
    readonly comment: string | null,
  ) {}

  static from(props: { comment: string | null; outcome: string }): NominationFileOutcome {
    const outcome = this.assertIsNominationFileOutcome(props.outcome);
    const comment = this.assertRequiredComment({
      comment: props.comment,
      outcome,
    });

    return new NominationFileOutcome(outcome, comment);
  }

  private static assertIsNominationFileOutcome(value: any): NominationFileOutcomeEnum {
    if (!NOMINATION_FILE_OUTCOMES.includes(value)) {
      throw new UnknownNominationFileOutcome(value);
    }

    return value;
  }

  private static assertRequiredComment(props: {
    comment: string | null;
    outcome: NominationFileOutcomeEnum;
  }): string | null {
    const comment = props.comment?.trim() || null;
    if (NominationFileOutcome.commentRequired(props.outcome) && !isDefined(comment)) {
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
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum;
}): string {
  switch (props.outcome) {
    case 'VALIDATED': {
      switch (props.formation) {
        case 'PARQUET':
          return 'avis favorable';
        case 'SIEGE':
          return 'avis conforme';
        default:
          return assertNever(props.formation);
      }
    }

    case 'NON_VALIDATED': {
      switch (props.formation) {
        case 'PARQUET':
          return 'avis défavorable';
        case 'SIEGE':
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

    case 'WAITING_DSJ':
      return 'en attente complément DSJ';

    default:
      return assertNever(props.outcome);
  }
}
