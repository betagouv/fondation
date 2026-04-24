import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import { FormationEnum, type NominationFileOutcomeEnum } from '@/types/enums.types';
import { useNominationFileOutcome } from './nomination-file-outcome-badge.utils';

function InnerNominationFileOutcomeBadge(props: {
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum | null;
  short?: boolean;
}) {
  const { badge, acronym, icon, severity, label } = useNominationFileOutcome(props);

  const badgeLabel = props.short === true ? acronym : badge.toUpperCase();

  if (props.outcome === null) return '-';

  // ts hack to add the title
  const badgeProps = { title: props.short ? label : undefined };
  return (
    <Badge {...badgeProps} small severity={severity} noIcon as="span">
      {icon && (
        <i className={`mr-1 leading-3 before:size-3 before:align-middle before:content-[""] ${icon}`} />
      )}
      {badgeLabel}
    </Badge>
  );
}

export const NominationFileOutcomeBadge = React.memo(InnerNominationFileOutcomeBadge, (prev, props) =>
  (['formation', 'outcome', 'short'] as const).every((prop) =>
    prop === 'short' ? !!prev.short === !!props.short : Object.is(prev[prop], props[prop])
  )
);
