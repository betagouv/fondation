import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import { FormationEnum, type NominationFileOutcomeEnum } from '@/types/enums.types';

import { useOutcomeBadge } from './outcome-badge.utils';

function InnerOutcomeBadge(props: {
  acronym?: boolean;
  formation: FormationEnum;
  label?: string;
  outcome: NominationFileOutcomeEnum | null;
  small?: boolean;
}) {
  const { badge, acronym, severity } = useOutcomeBadge(props);

  const badgeLabel = props.acronym === true ? acronym : badge.toUpperCase();

  if (props.outcome === null) return '-';

  // ts hack to add the title
  const badgeProps = { title: props.acronym ? (props.label ?? badge) : undefined };
  return (
    <Badge
      {...badgeProps}
      as="span"
      className="h-6 text-nowrap"
      noIcon
      severity={severity}
      small={props.small ?? true}
    >
      {badgeLabel}
    </Badge>
  );
}

export const OutcomeBadge = React.memo(InnerOutcomeBadge, (prev, props) =>
  (['acronym', 'formation', 'label', 'outcome', 'small'] as const).every((prop) =>
    prop === 'acronym' || prop === 'small'
      ? !!prev[prop] === !!props[prop]
      : Object.is(prev[prop], props[prop]),
  ),
);
