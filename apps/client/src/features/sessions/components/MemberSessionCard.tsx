import type { BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { getMySessionFilesPath } from '@/features/reports/hooks/useMyFilesFilter';
import { FormationBadge } from '@/shared/components/formation-badge';
import {
  REPORT_STATUSES,
  type ReportStatusEnum,
  ReportStatusEnumMessages,
} from '@/shared/enums/report-status.enum';
import { TotalBadge } from '@/shared/ui/total-badge';
import { dateOnlyToIso, formatLongDateOnly } from '@/utils/date-only.util';
import { getDetailSessionGdsPath } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';
import type { ListedMemberSession } from '@queries/members.queries';

const REPORT_STATUS_SEVERITIES = {
  IN_PROGRESS: 'new',
  NEW: 'error',
  READY_TO_SUPPORT: 'info',
  SUPPORTED: 'success',
} as const satisfies Record<ReportStatusEnum, BadgeProps['severity']>;

export function MemberSessionCard(props: { session: ListedMemberSession }) {
  const { formatMessage } = useIntl();
  const { user } = useUser();

  return (
    <article className="fr-enlarge-link relative border border-(--border-default-grey) p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="flex flex-col items-start gap-3">
          <FormationBadge formation={props.session.formation} small />
          <h3 className="fr-h6 fr-mb-0 flex flex-wrap items-baseline gap-x-3">
            <Link
              className="text-(--text-title-blue-france)"
              to={getDetailSessionGdsPath({ sessionId: props.session.id })}
              viewTransition
            >
              {props.session.name}
            </Link>
            <time
              className="fr-text--sm fr-mb-0 font-normal text-(--text-mention-grey)"
              dateTime={dateOnlyToIso(props.session.date)}
            >
              {formatLongDateOnly(props.session.date)}
            </time>
          </h3>
          <p className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage
              defaultMessage="{fileCount, plural, one {# dossier} other {# dossiers}} sur {propositionCount, plural, one {# proposition} other {# propositions}}"
              values={{
                fileCount: props.session.fileCount,
                propositionCount: props.session.propositionCount,
              }}
            />
          </p>
        </div>

        {props.session.isAffected && (
          <div className="relative z-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-full bg-(--background-alt-grey) px-4 py-1.5 text-sm">
            {user && (
              <span className="inline-flex items-center gap-2 text-(--text-action-high-blue-france)">
                <span aria-hidden className="fr-icon-file-text-line fr-icon--sm" />
                <Link
                  className="fr-link fr-link--sm font-medium underline-offset-4 before:hidden! hover:bg-transparent! hover:underline"
                  to={getMySessionFilesPath({ sessionId: props.session.id, userId: user.id })}
                  viewTransition
                >
                  <FormattedMessage defaultMessage="Vos dossiers" />{' '}
                  <span className="fr-sr-only">
                    <FormattedMessage
                      defaultMessage="de la session {name}"
                      values={{ name: props.session.name }}
                    />
                  </span>
                </Link>
              </span>
            )}
            <ul
              aria-label={formatMessage({ defaultMessage: 'Vos dossiers par état' })}
              className="m-0 flex list-none flex-wrap gap-x-3 gap-y-2 p-0"
            >
              {REPORT_STATUSES.map((status) => (
                <li className="p-0" key={status}>
                  <TotalBadge
                    severity={REPORT_STATUS_SEVERITIES[status]}
                    value={props.session.reportCounts[status]}
                  >
                    <FormattedMessage {...ReportStatusEnumMessages[status]} />
                  </TotalBadge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
