import { useIntl } from 'react-intl';

import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';

export function MemberListHeader() {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();

  return (
    <Breadcrumb
      ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la gestion des membres" })}
      breadcrumb={{
        currentPageLabel: formatMessage({ defaultMessage: 'Gérer les membres' }),
        segments: breadcrumbRoot,
      }}
      id="manage-members-breadcrumb"
    />
  );
}
