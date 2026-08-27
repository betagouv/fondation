import Badge, { type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import type { ReactNode } from 'react';

export function TotalBadge(props: {
  children: ReactNode;
  severity?: BadgeProps['severity'];
  value: NonNullable<ReactNode>;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {props.children}
      <Badge as="span" className="normal-case" noIcon severity={props.severity} small>
        {props.value}
      </Badge>
    </span>
  );
}
