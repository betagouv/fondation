import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, matchPath, useLocation, useParams } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useSessionBreadcrumbRoot } from '@/utils/transparences-breadcrumb.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaBreadCrumb() {
  const { formatMessage } = useIntl();
  const sessionRootOf = useSessionBreadcrumbRoot('SG');
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const { pathname } = useLocation();
  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  const label = useMemo(() => {
    if (matchPath({ path: ROUTE_PATHS.SG.GDS.AGENDA_UPDATE_METADATA }, pathname)) {
      return formatMessage({ defaultMessage: `Données d'un ordre du jour` });
    }

    if (matchPath({ path: ROUTE_PATHS.SG.GDS.AGENDA_UPDATE_FILES }, pathname)) {
      return formatMessage({ defaultMessage: `Propositions d'un ordre du jour` });
    }

    if (matchPath({ path: ROUTE_PATHS.SG.GDS.AGENDA_EDIT }, pathname)) {
      return formatMessage({ defaultMessage: `Texte d'un ordre du jour` });
    }

    if (matchPath({ path: ROUTE_PATHS.SG.GDS.AGENDA_PREVIEW }, pathname)) {
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
          ...sessionRootOf(session),
          {
            to: generatePath(ROUTE_PATHS.SG.GDS.SESSION_ID, { sessionId }),
            label: session?.name ?? formatMessage({ defaultMessage: 'Session' }),
          },
        ],
      }}
    />
  );
}
