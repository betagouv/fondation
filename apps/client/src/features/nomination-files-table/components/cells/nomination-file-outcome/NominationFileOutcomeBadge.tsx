import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import { FormationEnum, type NominationFileOutcomeEnum } from '@/types/enums.types';

import { useNominationFileOutcome } from './nomination-file-outcome-badge.utils';

function InnerNominationFileOutcomeBadge(props: {
  acronym?: boolean;
  formation: FormationEnum;
  label?: string;
  outcome: NominationFileOutcomeEnum | null;
  small?: boolean;
}) {
  const { badge, acronym, icon, severity } = useNominationFileOutcome(props);

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
      {icon && (
        <i className={`fr-mr-1v leading-3 before:size-3! before:align-middle before:content-[""] ${icon}`} />
      )}
      {badgeLabel}
    </Badge>
  );
}

export const NominationFileOutcomeBadge = React.memo(InnerNominationFileOutcomeBadge, (prev, props) =>
  (['acronym', 'formation', 'label', 'outcome', 'small'] as const).every((prop) =>
    prop === 'acronym' || prop === 'small'
      ? !!prev[prop] === !!props[prop]
      : Object.is(prev[prop], props[prop]),
  ),
);
