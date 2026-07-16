import { FormationEnum } from 'src/modules/shared/formation.enum';
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

const OUTCOMES_IN_SELECTION_ORDER = Object.freeze(
  Object.values({
    VALIDATED: 'VALIDATED',
    NON_VALIDATED: 'NON_VALIDATED',
    SUSPENDED: 'SUSPENDED',
    WAITING_DSJ: 'WAITING_DSJ',
    ASSESSING: 'ASSESSING',
    WITHDRAWN: 'WITHDRAWN',
    REMOVED: 'REMOVED',
  } satisfies { [K in NominationFileOutcomeEnum]: K }),
);

export type SelectableNominationFileOutcome = {
  value: NominationFileOutcomeEnum;
  label: string;
  commentRequired: boolean;
};

export class NominationFileOutcome {
  /** @internal exposed for DTOs definitions  */
  static readonly enum = NOMINATION_FILE_OUTCOMES;

  static finalOutcomes(): FinalNominationFileOutcomeEnum[] {
    return [...FINAL_OUTCOMES];
  }

  static nonFinalOutcomes(): NonFinalNominationFileOutcomeEnum[] {
    return [...NON_FINAL_OUTCOMES];
  }

  static allowsAudition(outcome: NominationFileOutcomeEnum | null): boolean {
    return outcome === null || (NON_FINAL_OUTCOMES as readonly NominationFileOutcomeEnum[]).includes(outcome);
  }

  static commentRequired(outcome: NominationFileOutcomeEnum): boolean {
    return outcome === 'NON_VALIDATED';
  }

  static selectableOutcomes(formation: FormationEnum): SelectableNominationFileOutcome[] {
    return OUTCOMES_IN_SELECTION_ORDER.map((value) => ({
      value,
      label: nominationFileOutcomeLabel({ outcome: value, formation }),
      commentRequired: NominationFileOutcome.commentRequired(value),
    }));
  }

  static assertAllowsAudition(outcome: NominationFileOutcomeEnum | null): void {
    if (!this.allowsAudition(outcome)) throw new NominationFileCannotBeAuditioned(outcome!);
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

export class NominationFileCannotBeAuditioned extends Error {
  constructor(readonly outcome: NominationFileOutcomeEnum) {
    super();
  }
}

export function nominationFileOutcomeLabel(props: {
  outcome: NominationFileOutcomeEnum;
  formation: FormationEnum;
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

    case 'ASSESSING':
      return 'en attente évaluation';

    case 'WAITING_DSJ':
      return 'en attente complément DSJ';

    default:
      return assertNever(props.outcome);
  }
}
