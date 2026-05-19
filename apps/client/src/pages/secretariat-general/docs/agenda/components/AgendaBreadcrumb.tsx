import React from 'react';
import { useIntl } from 'react-intl';
import { generatePath, matchPath, useLocation, useParams } from 'react-router';

import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaBreadCrumb() {
  const { formatMessage } = useIntl();
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const { pathname } = useLocation();
  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  const label = React.useMemo(() => {
    if (matchPath({ path: ROUTE_PATHS.SG.AGENDA_UPDATE }, pathname)) {
      return formatMessage({ defaultMessage: `Mise à jour d'un ordre du jour` });
    }

    if (matchPath({ path: ROUTE_PATHS.SG.AGENDA_PREVIEW }, pathname)) {
      return formatMessage({ defaultMessage: `Validation d'un ordre du jour` });
    }

    return formatMessage({ defaultMessage: `Génération d'un ordre du jour` });
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
