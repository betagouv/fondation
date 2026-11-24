import { FormattedMessage, useIntl } from 'react-intl';

import { Timeline } from '@/shared/ui/timeline';
import { Tooltip } from '@/shared/ui/tooltip';
import { whoWrote } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import type { CallForApplications } from '@queries/calls-for-applications.queries';

/** the day of the last change, and the whole history of the call on hovering or focusing the clock */
export function CallForApplicationsLastChange(props: Pick<CallForApplications, 'history'>) {
  const { formatDate } = useIntl();
  const { user } = useUser();
  const [last] = props.history;

  return (
    <div className="flex items-center gap-2">
      {last && formatDate(last.at, { format: 'zonedDateShort' })}
      <Tooltip
        focusable
        label={
          <Timeline
            items={props.history.map(({ action, at, by }) => ({
              at,
              content: (
                <FormattedMessage
                  defaultMessage="{action}{who, select, self { par vous} someone { par {name}} other {}}"
                  values={{
                    action: action.label,
                    name: by?.name,
                    who: whoWrote({ currentUserId: user?.id, writer: by }),
                  }}
                />
              ),
              key: `${at} ${action.id}`,
            }))}
          />
        }
      >
        <span aria-hidden className="ri-history-line fr-icon--sm text-(--text-mention-grey)" />
        <span className="fr-sr-only">
          <FormattedMessage defaultMessage="Historique de l'appel à candidatures" />
        </span>
      </Tooltip>
    </div>
  );
}
