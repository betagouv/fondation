import { useId } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { MemberOngoingSessions } from '@/features/sessions/components/MemberOngoingSessions';
import { LoadFailure } from '@/shared/ui/load-failure';
import { clock } from '@/utils/clock';
import { greetingAt, GreetingMessages } from '@/utils/greeting.utils';
import { useUser } from '@queries/auth.queries';
import { useListMemberGdsSessions } from '@queries/members.queries';

export function MemberHomePage() {
  const { formatMessage } = useIntl();
  const { user } = useUser();
  const sessions = useListMemberGdsSessions({ userId: user?.id });
  const gdsTabId = useId();
  const gdsPanelId = useId();

  return (
    <div className="grow">
      <div className="bg-(--blue-france-925-125)">
        <div className="fr-container flex flex-col gap-16 pt-20">
          <div>
            <h1 className="fr-h3 text-(--text-title-blue-france)">
              <FormattedMessage
                {...GreetingMessages[greetingAt(clock.now())]}
                values={{ civility: user?.civility }}
              />
            </h1>
            <p className="fr-text--lg fr-mb-0">
              <FormattedMessage defaultMessage="Sur quel pouvoir de proposition souhaitez-vous travailler ?" />
            </p>
          </div>

          <ul
            aria-label={formatMessage({ defaultMessage: 'Pouvoir de proposition' })}
            className="fr-tabs__list m-0 gap-6 p-0 [&_button]:w-full [&_button]:justify-center [&>li]:flex-1 md:[&>li]:max-w-sm"
            role="tablist"
          >
            <li role="presentation">
              <button
                aria-controls={gdsPanelId}
                aria-selected
                className="fr-tabs__tab"
                id={gdsTabId}
                role="tab"
                type="button"
              >
                <FormattedMessage defaultMessage="Garde des Sceaux" />
              </button>
            </li>
            <li role="presentation">
              <button aria-selected={false} className="fr-tabs__tab" disabled role="tab" type="button">
                <FormattedMessage defaultMessage="CSM (en construction)" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div aria-labelledby={gdsTabId} className="fr-container pt-14 pb-12" id={gdsPanelId} role="tabpanel">
        {sessions.isError ? (
          <LoadFailure
            isRetrying={sessions.isRefetching}
            message={<FormattedMessage defaultMessage="Les sessions en cours n'ont pas pu être chargées" />}
            onRetry={() => void sessions.refetch()}
          />
        ) : sessions.data ? (
          <MemberOngoingSessions sessions={sessions.data.items} />
        ) : (
          <p className="fr-mb-0" role="status">
            <FormattedMessage defaultMessage="Chargement des sessions en cours..." />
          </p>
        )}
      </div>
    </div>
  );
}
