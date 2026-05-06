import type { AlertProps } from '@codegouvfr/react-dsfr/Alert';
import Badge from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import { PrioriteEnumLabels, type PrioriteEnum } from '@/types/enums.types';

const color = {
  ETOILE: 'warning',
  OUTRE_MER: 'new',
  PROFILE: 'info',
} as const satisfies Record<PrioriteEnum, AlertProps.Severity | 'new' | null>;

const acronyms = {
  ETOILE: 'E',
  OUTRE_MER: 'OM',
  PROFILE: 'P',
} as const satisfies Record<PrioriteEnum, string>;

function InternalPriorityBadge(props: { priority: PrioriteEnum; small?: false; acronym?: true }) {
  const label = props.acronym ? acronyms[props.priority] : PrioriteEnumLabels[props.priority];
  return (
    <Badge noIcon severity={color[props.priority]} small={props.small !== false} as="span">
      {label}
    </Badge>
  );
}

export const PriorityBadge = React.memo(InternalPriorityBadge);

function InternalPriorityBadgeList(props: {
  priorities: readonly PrioriteEnum[];
  small?: false;
  acronym?: true;
}) {
  const priorities = React.useMemo(() => Array.from(new Set(props.priorities)).sort(), [props.priorities]);

  if (priorities.length === 0) return null;
  return (
    <ul className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0">
      {priorities.map((priority) => (
        <li className="m-0 p-0" key={priority}>
          <PriorityBadge priority={priority} small={props.small} acronym={props.acronym} />
        </li>
      ))}
    </ul>
  );
}

export const PriorityBadgeList = React.memo(InternalPriorityBadgeList);
