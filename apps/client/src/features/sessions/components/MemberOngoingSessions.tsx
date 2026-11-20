import { useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ToggleSwitch } from '@/shared/ui/toggle-switch';
import type { ListedMemberSession } from '@queries/members.queries';

import { MemberSessionCard } from './MemberSessionCard';

export function MemberOngoingSessions(props: { sessions: ListedMemberSession[] }) {
  const { formatMessage } = useIntl();
  const titleId = useId();
  const [onlyReporter, setOnlyReporter] = useState(false);
  const sessions = onlyReporter ? props.sessions.filter(({ isAffected }) => isAffected) : props.sessions;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="fr-h5 fr-mb-0" id={titleId}>
          <FormattedMessage
            defaultMessage="{count, plural, one {# session en cours} other {# sessions en cours}}"
            values={{ count: sessions.length }}
          />
        </h2>
        {props.sessions.length > 0 && (
          <ToggleSwitch
            checked={onlyReporter}
            classes={{ label: 'w-auto! before:mr-3! md:whitespace-nowrap' }}
            label={formatMessage({
              defaultMessage: 'Afficher uniquement les sessions où je suis rapporteur',
            })}
            labelPosition="right"
            onChange={setOnlyReporter}
            showCheckedHint={false}
          />
        )}
      </div>

      <p className="fr-sr-only" role="status">
        <FormattedMessage
          defaultMessage="{count, plural, =0 {Aucune session affichée} one {# session affichée} other {# sessions affichées}}"
          values={{ count: sessions.length }}
        />
      </p>

      {sessions.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-6 p-0">
          {sessions.map((session) => (
            <li className="p-0" key={session.id}>
              <MemberSessionCard session={session} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="fr-mb-0">
          {onlyReporter ? (
            <FormattedMessage defaultMessage="Vous n'êtes rapporteur sur aucune session en cours" />
          ) : (
            <FormattedMessage defaultMessage="Aucune session en cours" />
          )}
        </p>
      )}
    </section>
  );
}
