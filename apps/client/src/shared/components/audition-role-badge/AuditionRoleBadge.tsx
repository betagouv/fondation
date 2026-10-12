import Badge from '@codegouvfr/react-dsfr/Badge';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

const ROLE_COLORS = {
  OBSERVANT: 'bg-(--background-contrast-blue-cumulus)! text-(--text-label-blue-cumulus)!',
  PROPOSED: 'bg-(--background-contrast-yellow-tournesol)! text-(--text-label-yellow-tournesol)!',
} as const;

export function AuditionRoleBadge(props: { className?: string; role: keyof typeof ROLE_COLORS }) {
  return (
    <Badge className={clsx('justify-self-start', ROLE_COLORS[props.role], props.className)} small>
      {props.role === 'OBSERVANT' ? (
        <FormattedMessage defaultMessage="Observant" />
      ) : (
        <FormattedMessage defaultMessage="Proposé" />
      )}
    </Badge>
  );
}
