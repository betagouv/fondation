import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, matchPath, useLocation } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function PresentationBreadcrumb() {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();

  const label = useMemo(() => {
    if (matchPath({ path: ROUTE_PATHS.SG.PRESENTATIONS_NEW }, pathname)) {
      return formatMessage({ defaultMessage: `Génération d'une notice` });
    }

    if (matchPath({ path: ROUTE_PATHS.SG.PRESENTATIONS_UPDATE }, pathname)) {
      return formatMessage({ defaultMessage: `Données d'une notice` });
    }

    if (matchPath({ path: ROUTE_PATHS.SG.PRESENTATIONS_EDIT }, pathname)) {
      return formatMessage({ defaultMessage: `Texte d'une notice` });
    }

    return formatMessage({ defaultMessage: `Validation d'une notice` });
  }, [formatMessage, pathname]);

  return (
    <Breadcrumb
      ariaLabel={formatMessage({ defaultMessage: `Fil d'Ariane du secrétariat général` })}
      breadcrumb={{
        currentPageLabel: label,
        segments: [
          {
            label: formatMessage({ defaultMessage: 'Secrétariat général' }),
            to: generatePath(ROUTE_PATHS.SG.DASHBOARD),
          },
          {
            label: formatMessage({ defaultMessage: 'Restitutions' }),
            to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY),
          },
        ],
      }}
      id="presentation-breadcrumb"
    />
  );
}
