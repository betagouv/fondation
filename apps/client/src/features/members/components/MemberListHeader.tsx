import { useIntl } from 'react-intl';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function MemberListHeader() {
  const { formatMessage } = useIntl();

  return (
    <Breadcrumb
      ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la gestion des membres" })}
      breadcrumb={{
        currentPageLabel: formatMessage({ defaultMessage: 'Gérer les membres' }),
        segments: [
          { label: formatMessage({ defaultMessage: 'Secrétariat général' }), to: ROUTE_PATHS.SG.DASHBOARD },
        ],
      }}
      id="manage-members-breadcrumb"
    />
  );
}
