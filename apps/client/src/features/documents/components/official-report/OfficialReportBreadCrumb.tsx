import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, matchPath, useLocation, useParams } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function OfficialReportBreadCrumb() {
  const { formatMessage } = useIntl();
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const { pathname } = useLocation();
  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  const label = useMemo(() => {
    if (matchPath({ path: ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE }, pathname)) {
      return formatMessage({ defaultMessage: `Mise à jour d'un PV` });
    }

    if (matchPath({ path: ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW }, pathname)) {
      return formatMessage({ defaultMessage: `Validation d'un PV` });
    }

    return formatMessage({ defaultMessage: `Génération d'un PV` });
  }, [formatMessage, pathname]);

  return (
    <Breadcrumb
      id="docs-breadcrumb"
      ariaLabel={formatMessage({ defaultMessage: `Fil d'Ariane du secrétariat général` })}
      breadcrumb={{
        currentPageLabel: label,
        segments: [
          { to: generatePath(ROUTE_PATHS.SG.DASHBOARD), label: 'Secrétariat général' },
          { to: generatePath(ROUTE_PATHS.SG.MANAGE_SESSION), label: 'Gérer une session' },
          { to: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId }), label: session?.name ?? 'Session' },
        ],
      }}
    />
  );
}
