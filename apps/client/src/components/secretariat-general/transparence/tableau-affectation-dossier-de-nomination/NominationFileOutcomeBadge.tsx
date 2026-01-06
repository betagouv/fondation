import { FormationEnum, type NominationFileOutcomeEnum, outcomeLabels } from '@/types/enums.types';
import Badge from '@codegouvfr/react-dsfr/Badge';

export function NominationFileOutcomeShortBadge(props: {
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum;
}) {
  if (props.outcome === null) return '-';

  const { acronym } = outcomeLabels({ formation: props.formation, value: props.outcome });

  // prettier-ignore
  switch (props.outcome) {
    case 'VALIDATED':
      return <Badge small severity="success">{acronym}</Badge>;
    case 'NON_VALIDATED':
      return <Badge small severity="error">{acronym}</Badge>;
    case 'SUSPENDED':
      return <Badge small severity="info">{acronym}</Badge>;
    case 'REMOVED':
      return <Badge small severity="warning">{acronym}</Badge>;
    case 'WITHDRAWN':
      return <Badge small>{acronym}</Badge>;
  }
}

export function NominationFileOutcomeBadge(props: {
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum;
}) {
  if (props.outcome === null) return '-';

  const { badge } = outcomeLabels({ formation: props.formation, value: props.outcome });

  // prettier-ignore
  switch (props.outcome) {
    case 'VALIDATED':
      return <Badge small severity="success">{badge.toUpperCase()}</Badge>;
    case 'NON_VALIDATED':
      return <Badge small severity="error">{badge.toUpperCase()}</Badge>;
    case 'SUSPENDED':
      return <Badge small severity="info">{badge.toUpperCase()}</Badge>;
    case 'REMOVED':
      return <Badge small severity="warning">{badge.toUpperCase()}</Badge>;
    case 'WITHDRAWN':
      return <Badge small>{badge.toUpperCase()}</Badge>;
  }
}
