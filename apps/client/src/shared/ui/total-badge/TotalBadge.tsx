import Badge from '@codegouvfr/react-dsfr/Badge';
import type { ReactNode } from 'react';

export function TotalBadge(props: { children: ReactNode; value: NonNullable<ReactNode> }) {
  return (
    <p className="fr-m-0 flex items-center gap-2 text-sm">
      {props.children}
      <Badge as="span" className="normal-case" noIcon small>
        {props.value}
      </Badge>
    </p>
  );
}
