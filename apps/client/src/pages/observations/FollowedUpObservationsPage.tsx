import { useIntl } from 'react-intl';

import { FollowedUpObservationsTable } from '@/features/observations/components/FollowedUpObservationsTable';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';

export function FollowedUpObservationsPage() {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();

  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du suivi des observations" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Suivi des observations' }),
          segments: breadcrumbRoot,
        }}
        id="followed-up-observations-breadcrumb"
      />
      <FollowedUpObservationsTable />
    </div>
  );
}
