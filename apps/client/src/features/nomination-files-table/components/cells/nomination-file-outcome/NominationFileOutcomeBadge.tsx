import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import { FormationEnum, type NominationFileOutcomeEnum } from '@/types/enums.types';

import { useNominationFileOutcome } from './nomination-file-outcome-badge.utils';

function InnerNominationFileOutcomeBadge(props: {
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum | null;
  short?: boolean;
  small?: boolean;
}) {
  const { badge, acronym, icon, severity, label } = useNominationFileOutcome(props);

  const badgeLabel = props.short === true ? acronym : badge.toUpperCase();

  if (props.outcome === null) return '-';

  // ts hack to add the title
  const badgeProps = { title: props.short ? label : undefined };
  return (
    <Badge
      {...badgeProps}
      small={props.small ?? true}
      severity={severity}
      noIcon
      as="span"
      className="text-nowrap"
    >
      {icon && (
        <i className={`fr-mr-1v leading-3 before:size-3! before:align-middle before:content-[""] ${icon}`} />
      )}
      {badgeLabel}
    </Badge>
  );
}

export const NominationFileOutcomeBadge = React.memo(InnerNominationFileOutcomeBadge, (prev, props) =>
  (['formation', 'outcome', 'short', 'small'] as const).every((prop) =>
    prop === 'short' || prop === 'small'
      ? !!prev[prop] === !!props[prop]
      : Object.is(prev[prop], props[prop]),
  ),
);
