import Badge from '@codegouvfr/react-dsfr/Badge';
import clsx from 'clsx';
import React from 'react';

import { PrioriteEnumLabels, type PrioriteEnum } from '@/types/enums.types';

const colorClassName = {
  ETOILE: 'bg-(--background-contrast-warning) text-(--text-default-warning)',
  OUTRE_MER: 'bg-(--yellow-tournesol-950-100) text-(--yellow-tournesol-sun-407-moon-922)',
  PROFILE: 'bg-(--background-contrast-info) text-(--text-default-info)',
} as const satisfies Record<PrioriteEnum, string>;

const acronyms = {
  ETOILE: 'E',
  OUTRE_MER: 'OM',
  PROFILE: 'P',
} as const satisfies Record<PrioriteEnum, string>;

function InternalPriorityBadge(props: { acronym?: boolean; priority: PrioriteEnum; small?: boolean }) {
  const small = props.small ?? true;
  const label = props.acronym ? acronyms[props.priority] : PrioriteEnumLabels[props.priority];
  return (
    <Badge
      as="span"
      className={clsx(colorClassName[props.priority], !props.acronym && small && 'h-6')}
      noIcon
      small={small}
    >
      {label}
    </Badge>
  );
}

export const PriorityBadge = React.memo(InternalPriorityBadge);

function InternalPriorityBadgeList(props: {
  acronym?: boolean;
  priorities: readonly PrioriteEnum[];
  small?: boolean;
}) {
  const priorities = React.useMemo(() => Array.from(new Set(props.priorities)).sort(), [props.priorities]);

  if (priorities.length === 0) return null;
  return (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1">
      {priorities.map((priority) => (
        <li className="fr-m-0 fr-p-0" key={priority}>
          <PriorityBadge acronym={props.acronym} priority={priority} small={props.small} />
        </li>
      ))}
    </ul>
  );
}

export const PriorityBadgeList = React.memo(InternalPriorityBadgeList);
