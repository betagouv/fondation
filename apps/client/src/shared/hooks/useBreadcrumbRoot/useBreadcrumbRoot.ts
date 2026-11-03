import { useIntl } from 'react-intl';

import { usePouvoirDeProposition } from '@/shared/hooks/usePouvoirDeProposition';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function useBreadcrumbRoot(): { label: string; to: string }[] {
  const { formatMessage } = useIntl();
  const pouvoir = usePouvoirDeProposition();

  if (pouvoir !== 'GDS') return [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: '/' }];

  return [
    { label: formatMessage({ defaultMessage: 'Accueil' }), to: ROUTE_PATHS.SG.DASHBOARD },
    { label: formatMessage({ defaultMessage: 'GDS' }), to: ROUTE_PATHS.SG.MANAGE_SESSION },
  ];
}
