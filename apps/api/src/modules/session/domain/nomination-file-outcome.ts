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

export function nominationFileOutcomeLabel(props: {
  outcome: NominationFileOutcomeEnum;
  formation: Magistrat.Formation;
}): string {
  switch (props.formation) {
    case Magistrat.Formation.PARQUET:
      switch (props.outcome) {
        case 'VALIDATED':
          return 'avis favorable';
        case 'NON_VALIDATED':
          return 'avis défavorable';
        case 'SUSPENDED':
          return 'sursis à statuer';
        case 'REMOVED':
          return 'retrait';
        case 'WITHDRAWN':
          return 'retrait (désistement)';
        case 'ASSESSING':
          return 'En attente évaluation';
        case 'WAITING_DSJ':
          return 'En attente complément DSJ';
        default:
          return assertNever(props.outcome);
      }

    case Magistrat.Formation.SIEGE:
      switch (props.outcome) {
        case 'VALIDATED':
          return 'avis conforme';
        case 'NON_VALIDATED':
          return 'avis non conforme';
        case 'SUSPENDED':
          return 'sursis à statuer';
        case 'REMOVED':
          return 'retrait';
        case 'WITHDRAWN':
          return 'retrait (désistement)';
        case 'ASSESSING':
          return 'En attente évaluation';
        case 'WAITING_DSJ':
          return 'En attente complément DSJ';
        default:
          return assertNever(props.outcome);
      }

    default:
      return assertNever(props.formation);
  }
}
