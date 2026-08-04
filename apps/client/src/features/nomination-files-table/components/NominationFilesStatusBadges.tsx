import Badge, { type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import { useNominationFilesStatusCountsQuery } from '@queries/nomination-sessions.queries';

function StatusCount(props: { count: number; label: ReactNode; severity?: BadgeProps['severity'] }) {
  return (
    <li className="fr-p-0 flex items-center gap-2">
      {props.label}
      <Badge as="span" noIcon severity={props.severity} small>
        {props.count}
      </Badge>
    </li>
  );
}

export function NominationFilesStatusBadges(props: { className?: string }) {
  const { sessionId, isEditable } = useNominationFilesTable();
  const { data: counts } = useNominationFilesStatusCountsQuery({ sessionId });

  if (!counts || !isEditable) return null;

  const { unaffected, inProgress, withOutcome } = counts;

  return (
    <ul className={clsx('fr-m-0 fr-p-0 flex list-none gap-6 text-sm', props.className)}>
      <StatusCount
        count={unaffected + inProgress + withOutcome}
        label={<FormattedMessage defaultMessage="Total" />}
      />
      <StatusCount
        count={unaffected}
        label={<FormattedMessage defaultMessage="À affecter" />}
        severity="warning"
      />
      <StatusCount
        count={inProgress}
        label={<FormattedMessage defaultMessage="En cours" />}
        severity="info"
      />
      <StatusCount
        count={withOutcome}
        label={<FormattedMessage defaultMessage="Issue renseignée" />}
        severity="success"
      />
    </ul>
  );
}
