import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { getGdsReportPath } from '@/utils/route-path.utils';
import type { ListedMemberSessionReportsDto } from '@api/types';
import { useUser } from '@queries/auth.queries';
import { useListMemberSessionReports } from '@queries/members.queries';

type MemberSessionReport = ListedMemberSessionReportsDto['items'][number];

export function ReportNavigation(props: { reportId: string; sessionId: string }) {
  const { formatMessage } = useIntl();
  const { user } = useUser();
  const { data } = useListMemberSessionReports({ sessionId: props.sessionId, userId: user?.id });

  const reports = data?.items ?? [];
  const position = reports.findIndex(({ report }) => report.id === props.reportId);
  if (position === -1) return null;

  const previous = reports[position - 1];
  const next = reports[position + 1];
  if (!previous && !next) return null;

  const describe = ({ name, number }: MemberSessionReport) =>
    number === null
      ? name
      : formatMessage({ defaultMessage: 'n°{number} - {name}' }, { name, number: String(number) });

  return (
    <nav
      aria-label={formatMessage({ defaultMessage: 'Navigation entre mes rapports' })}
      className="border-t border-b border-(--border-default-grey)"
    >
      <div className="fr-container fr-py-3v flex items-center justify-between gap-4">
        {previous ? (
          <Link
            className="fr-link fr-link--sm fr-link--icon-left fr-icon-arrow-left-s-line bg-none! font-medium no-underline!"
            to={getGdsReportPath(previous.report.id)}
          >
            <FormattedMessage defaultMessage="Précédent : {report}" values={{ report: describe(previous) }} />
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            className="fr-link fr-link--sm fr-link--icon-right fr-icon-arrow-right-s-line bg-none! font-medium no-underline!"
            to={getGdsReportPath(next.report.id)}
          >
            <FormattedMessage defaultMessage="Suivant : {report}" values={{ report: describe(next) }} />
          </Link>
        )}
      </div>
    </nav>
  );
}
