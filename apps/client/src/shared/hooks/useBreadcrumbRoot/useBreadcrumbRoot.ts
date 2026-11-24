import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { type PouvoirDeProposition, usePouvoirDeProposition } from '@/shared/hooks/usePouvoirDeProposition';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

/** `of` names the pouvoir of a page that belongs to one, whatever the tab was opened from */
export function useBreadcrumbRoot(of?: PouvoirDeProposition): { label: string; to: string }[] {
  const { formatMessage } = useIntl();
  const pagePouvoir = usePouvoirDeProposition();
  const pouvoir = of ?? pagePouvoir;

  return useMemo(() => {
    if (pouvoir === 'CSM') {
      return [
        { label: formatMessage({ defaultMessage: 'Accueil' }), to: ROUTE_PATHS.SG.DASHBOARD },
        { label: formatMessage({ defaultMessage: 'CSM' }), to: ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES },
      ];
    }
    if (pouvoir !== 'GDS') return [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: '/' }];

    return [
      { label: formatMessage({ defaultMessage: 'Accueil' }), to: ROUTE_PATHS.SG.DASHBOARD },
      { label: formatMessage({ defaultMessage: 'GDS' }), to: ROUTE_PATHS.SG.GDS.MANAGE_SESSION },
    ];
  }, [formatMessage, pouvoir]);
}
