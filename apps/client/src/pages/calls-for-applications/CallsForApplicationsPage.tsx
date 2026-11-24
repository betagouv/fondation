import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CallForApplicationsCreationModal } from '@/features/calls-for-applications/components/CallForApplicationsCreationModal';
import { CallsForApplicationsTable } from '@/features/calls-for-applications/components/CallsForApplicationsTable';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';

function CreateCallForApplicationsButton() {
  // the modal outlives the closing, for it to fade out with its content
  const [creation, setCreation] = useState<{ open: boolean } | null>(null);

  return (
    <>
      <Button
        className="btn-compact"
        iconId="fr-icon-add-line"
        onClick={() => setCreation({ open: true })}
        size="small"
      >
        <FormattedMessage defaultMessage="Créer un appel à candidatures" />
      </Button>
      {creation && (
        <CallForApplicationsCreationModal
          onClose={() => setCreation({ open: false })}
          onClosed={() => setCreation(null)}
          open={creation.open}
        />
      )}
    </>
  );
}

export function CallsForApplicationsPage() {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();

  return (
    <div className="fr-container fr-pb-8v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des appels à candidatures" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Appels à candidatures' }),
          segments: breadcrumbRoot,
        }}
        className="fr-mt-8v fr-mb-0"
        id="calls-for-applications-breadcrumb"
      />
      <div className="fr-mt-6v fr-mb-6v flex items-center justify-between gap-4">
        <h1 className="fr-h3 fr-mb-0">
          <FormattedMessage defaultMessage="Appels à candidatures" />
        </h1>
        <CreateCallForApplicationsButton />
      </div>
      <CallsForApplicationsTable />
    </div>
  );
}
